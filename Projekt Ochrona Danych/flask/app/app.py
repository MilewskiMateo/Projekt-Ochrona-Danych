import logging
import os


import math
from time import sleep
from flask import Flask, flash, session, request, render_template, render_template, make_response, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy 
from sqlalchemy.sql import exists
from sqlalchemy import Table, Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from base64 import b64encode, b64decode
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
from Cryptodome.Protocol.KDF import PBKDF2
from passlib.hash import bcrypt
from flask_wtf.csrf import CSRFProtect
import hashlib

app = Flask(__name__)
csrf = CSRFProtect(app)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
db = SQLAlchemy(app)


app.secret_key = "7^=WeyYMjCBmy1|"
app.config["PERMANENT_SESSION_LIFETIME"] = 300

log = app.logger

@app.after_request
def after_request_func(response):
    response.headers['server'] = "Secret"
    response.headers['Content-Security-Policy']=' default-src \'self\';font-src fonts.gstatic.com;style-src \'self\' fonts.googleapis.com'
    return response

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    login = db.Column(db.String(50))
    password = db.Column(db.String(500))
    notes = relationship("Notes")

class Notes(db.Model):
    __tablename__ = 'notes'
    id = Column(Integer, primary_key=True)
    parent_id = Column(Integer, ForeignKey('user.id'))
    note_title = db.Column(db.String(100))
    note_value = db.Column(db.String(500))
    note_type = db.Column(db.String(50))
    note_salt = db.Column(db.String(50))
    note_iv = db.Column(db.String(100))
    

def setup():
    log.setLevel(logging.DEBUG)


@app.route("/", methods=["GET"])
def home():
    isLoggedIn = 'login' in session
    if session.get('attempt') is None:
        session['attempt'] = 5

    response = make_response( render_template("/main/home.html", isLoggedIn=isLoggedIn))
    return response


@app.route("/registration", methods=["GET"])
def register():
    isLoggedIn = 'login' in session

    if session.get('attempt') is None:
        session['attempt'] = 5

    response = make_response( render_template("/main/registration.html", isLoggedIn=isLoggedIn))
    return response


@app.route("/registration/register", methods=["POST"])
def addUser():
    login = request.form['login']
    if(db.session.query(User.query.filter(User.login == login).exists()).scalar()):
        return jsonify({"responseMessage": "Użytkownik o takim loginie już istnieje"}), 201
    else:
        myDict = request.form.to_dict()
        if len(myDict['password']) <= 11:
            return jsonify({"responseMessage": "Zbyt krótkie hasło"}), 201
        if entropy(myDict['password']) <= 3:
            return jsonify({"responseMessage": "Zbyt słabe hasło"}), 201

        password_bcrypt = bcrypt.hash(myDict['password'])
        user = User(login=myDict['login'], password=password_bcrypt)
        
        db.session.add(user)
        db.session.commit()

    return redirect(url_for("home"))


@app.route("/login", methods=["GET"])
def login():
    if session.get('attempt') is None:
        session['attempt'] = 5
    return render_template("/main/login.html")


@app.route("/login/log", methods=["POST"])
def loginRequest():
    login = request.form['login']

    if session.get('attempt') is None:
        session['attempt'] = 5
        
    if(login == "AdminTomek" and request.form['password'] == "TajneHasloAdmina"):
        out = jsonify({"responseMessage": "Niepoprawne dane logowania", "honeypot":"Ktoś zaatakował honeypota w takiej sytuacji wysłał bym teraz jakąś wiadomość mailową/sms do właściciela strony"})
        return out

    attempt= session.get('attempt')
    attempt -= 1
    session['attempt']=attempt
    sleep(0.5 + (0.5 * (5 - attempt))) 
    if attempt<=0 or request.cookies.get('ban_coockie') is not None:
        client_ip = request.environ['REMOTE_ADDR']
        msg = 'Zostałeś zablokowany poczekaj 5 min, nim znowu spróbujesz'
        out = jsonify({"responseMessage": msg, "ip":client_ip + " w tej sytuacji również zbanowałbym ip z którego wysyłane są zapytania"})
        out.set_cookie('ban_coockie', 'banned', max_age=300)
        return out
    
    if(db.session.query(User.query.filter(User.login == login).exists()).scalar()):
        if(bcrypt.verify(request.form['password'], User.query.filter(User.login == login).first().password)):
            response = make_response(redirect(url_for('home')))
            session['login'] = login
            session.permanent = True
            return response
    if attempt==1:
        return jsonify({"responseMessage": 'Niepoprawne dane logowania. To twoja ostania szansa inaczej zostaniesz zablokowany czasowo' })
    else:
        return jsonify({"responseMessage": "Niepoprawne dane logowania"})




@app.route("/logout", methods=["GET"])
def logout():
    session.clear()
    response = make_response(render_template("/main/home.html"))
    return response


@app.route("/new_note", methods=["GET"])
def new_note():
    if 'login' in session:
        login = session['login']


        if(db.session.query(User.query.filter(User.login == login).exists()).scalar()):
            response = make_response(render_template("/main/new_note.html", isLoggedIn=True))
            return response
    else:
        return redirect(url_for('login'))

@app.route("/new_note/add", methods=["POST"])
def new_note_add():
    if 'login' in session:
        login = session['login']
        note_title = request.form.get('note_title')
        note_value =  request.form.get('note')
        note_type = request.form.get('type')

        if(db.session.query(Notes.query.filter(Notes.note_title == note_title).exists()).scalar()):
            return jsonify({"responseMessage": "Notatka o takim tytule już istnieje"}), 201
            
        if(db.session.query(User.query.filter(User.login == login).exists()).scalar()):
            if(note_type == "normal" or note_type == "public"):
            
                note = Notes(note_title = note_title,note_value=note_value, parent_id= User.query.filter(User.login == login).first().id,note_type=note_type)
                db.session.add(note)
                db.session.commit()
                return jsonify({"responseMessage": "Udalo sie"})
            elif(note_type=="secret"):
                note_salt = get_random_bytes(16)
                key = PBKDF2(request.form.get('note_password').encode('utf-8'),note_salt)
                data = note_value.encode('utf-8')

                cipher = AES.new(key, AES.MODE_CBC)
                ct_bytes = cipher.encrypt(pad(data, AES.block_size))
                note_iv = b64encode(cipher.iv).decode('utf-8')
                ct = b64encode(ct_bytes).decode('utf-8')

                note = Notes(note_title = note_title,note_value=ct, parent_id= User.query.filter(User.login == login).first().id,note_type=note_type,note_salt = note_salt, note_iv = note_iv)
                db.session.add(note)
                db.session.commit()
                return jsonify({"responseMessage": "Udalo sie"})

        else:
            return redirect(url_for('login'))
                         
    else:
        return redirect(url_for('login'))
        

@app.route("/notes", methods=["GET"])
def notes():
    if 'login' in session:
        login = session['login']

        if(db.session.query(User.query.filter(User.login == login).exists()).scalar()):
            notes_proxy = Notes.query.filter(Notes.parent_id == User.query.filter(User.login == login).first().id).all()
            notes_list = []
            for row in notes_proxy:
                notes_list.append(row.note_title)

            public_proxy = Notes.query.filter(Notes.note_type == 'public').all()
            public_list = []
            for row in public_proxy:
                public_list.append(row.note_title)

            response = make_response(render_template("/main/notes.html", isLoggedIn=True, notesList = notes_list, publicList = public_list))
            return response
        else:
            return redirect(url_for('login'))
    else:
        return redirect(url_for('login'))

@app.route("/notes/<string:note_title>", methods=["GET"])
def justNote(note_title):
    if 'login' in session:
        login = session['login']
        
        if(db.session.query(User.query.filter(User.login == login).exists()).scalar()):
            note = Notes.query.filter(Notes.note_title == note_title).first()
            if(User.query.filter(User.id == note.parent_id).first().login == login or note.note_type == 'public'):
                if(note.note_type == "normal" or note.note_type == "public"):
                    response = make_response(render_template("/main/normal_note.html", isLoggedIn=True,note = note))
                    return response
                elif(note.note_type == "secret"):
                    response = make_response(render_template("/main/secret_note.html", isLoggedIn=True,note_title = note.note_title))
                    return response
                    
            else:
                return redirect(url_for('login'))    
        else:
            return redirect(url_for('login'))
    else:
        return redirect(url_for('login'))

@app.route("/try", methods=["POST"])
def trySecret():
    if 'login' in session:
        login = session['login']
        
        note_title = request.form.get('note_title')

        if(db.session.query(User.query.filter(User.login == login).exists()).scalar()):
            note = Notes.query.filter(Notes.note_title == note_title).first()
            if(User.query.filter(User.id == note.parent_id).first().login == login):
                if(note.note_type == "normal" or note.note_type == "public"):
                    return jsonify({"responseMessage": "Nie powinno cię tu być"})
                elif(note.note_type == "secret"):


                    try:
                        key = PBKDF2(request.form.get('note_password').encode('utf-8'),note.note_salt)
                        iv = b64decode(note.note_iv)
                        ct = b64decode(note.note_value)
                        cipher = AES.new(key, AES.MODE_CBC, iv)
                        pt = unpad(cipher.decrypt(ct), AES.block_size)
                        
                        return redirect(url_for('decoded',note_value=pt))
                    except ValueError:
                        return jsonify({"responseMessage": "Niepoprawne hasło"})
                    except KeyError:
                        return jsonify({"responseMessage": "Niepoprawne hasło"})


            else:
                return redirect(url_for('login'))    
        else:
            return redirect(url_for('login'))
    else:
        return redirect(url_for('login'))


@app.route("/decoded", methods=["GET"])
def decoded():
    response = make_response(render_template("/main/secret_note_decoded.html", isLoggedIn=True,note_value = request.args.get('note_value')))
    return response

def entropy(d):
   stat={}
   for c in d:
       m=c
       if m in stat:
           stat[m] +=1
       else:
           stat[m]=1
   H=0.0
   for i in stat.keys():
       pi=stat[i]/len(d)
       H -=pi*math.log2(pi)
   return H