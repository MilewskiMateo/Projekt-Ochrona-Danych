document.addEventListener('DOMContentLoaded', function (event) {


    const POST = "POST";
    const URL_REGISTER = "https://localhost/registration/register";
    var EnableRegistration = false;

    //kolejnosci w liscie === login,haslo,haslo
    var formValidationList = new Array(3);
    for (var i = 0; i < formValidationList.length; i++) { formValidationList[i] = false; }

    let registrationForm = document.getElementById("registration-form");
    const login = document.getElementById('login');
    const password = document.getElementById('password');
    const second_password = document.getElementById('second_password');
    const progress = document.querySelector('.progress-done');



    var formValidationProxy = new Proxy(formValidationList, {
        set: function (target, key, value) {
            target[key] = value;

            if (formValidationList.every((e) => (e))) {
                EnableRegistration = true;
                document.getElementById("button-reg-form").className = "submit-button-available";
            } else {
                EnableRegistration = false;
                document.getElementById("button-reg-form").className = "submit-button-not-available";
            }

            return true;
        }
    });


    registrationForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (EnableRegistration) {
            submitRegisterForm();
            login.value = ""
            password.value = ""
            second_password.value =""
            EnableRegistration = false;
            document.getElementById("button-reg-form").className = "submit-button-not-available";
        }
    }
    );

    function submitRegisterForm() {
        let registerParams = {
            method: POST,
            body: new FormData(registrationForm),
        };

        fetch(URL_REGISTER, registerParams)
            .then(response => { if (response.redirected) { window.location.href = response.url } else { return response.json() } })
            .then(response => { setErrorFor(document.getElementById('button-reg-form'), response['responseMessage']) })
            .catch(err => {
                console.log("Caught error: " + err);
            });
    }

    /////////////////NADAWANIE LISTENEROW //////////////////////////

    login.addEventListener('change', (event) => {
        const loginValue = login.value.trim();
        if (loginValue === '') {
            setErrorFor(login, 'Login jest pusty');
            formValidationProxy[0] = false;
        } else if (!isLogin(loginValue)) {
            setErrorFor(login, 'Login musi się składać z minium 8 znaków będących małymi lub dużymi literami');
            formValidationProxy[0] = false;
        } else {
            setSuccessFor(login);
            formValidationProxy[0] = true;
        }
        if (registrationForm.getElementsByClassName("okStatusLabel")[0] != null) {
            registrationForm.removeChild(registrationForm.getElementsByClassName("okStatusLabel")[0]);
        }
    });


    password.addEventListener('change', (event) => {
        const loginValue = login.value.trim();
        const passwordValue = password.value.trim();
        zxc = entropy(passwordValue) / 5
        progress.style.width = zxc * 100 + '%';
        if ( zxc < 0.25){
            progress.style.background = 'red'
        }
        if ( zxc > 0.25 && zxc < 0.6 ){
            progress.style.background = 'orange'
        }
        if ( zxc > 0.6 && zxc < 0.85 ){
            progress.style.background = 'lightgreen'
        }
        if ( zxc > 0.85){
            progress.style.background = 'green'
        }

        progress.style.opacity = 1;
        if (passwordValue.length <= 12) {
            setErrorFor(password, "Hasło musi się składać z conajmniej 12 znaków");
            formValidationProxy[1] = false;
        }else if (zxc <= 0.6) {
            setErrorFor(password, "Zbyt słabe hasło");
            formValidationProxy[1] = false;
        } else {
            setSuccessFor(password);
            formValidationProxy[1] = true;
        }
    });
    second_password.addEventListener('change', (event) => {
        const second_passwordValue = second_password.value.trim();
        const passwordValue = password.value.trim();
        if (second_passwordValue === '') {
            setErrorFor(second_password, 'Hasło jest puste');
            formValidationProxy[2] = false;
        } else if (passwordValue !== second_passwordValue) {
            setErrorFor(second_password, 'Hasła się nie zgadzają');
            formValidationProxy[2] = false;
        } else {
            setSuccessFor(second_password);
            formValidationProxy[2] = true;
        }
    });



    /////////////////POMOCNICZE///////////////////////

    function setErrorFor(input, message) {
        if (input.parentElement.getElementsByClassName('warning-message')[0] != null) {
            input.parentElement.removeChild(input.parentElement.getElementsByClassName('warning-message')[0]);
        }
        var errorLabel = document.createElement("label");

        errorLabel.appendChild(document.createTextNode(message));
        errorLabel.className = "warning-message"
        errorLabel.id = "warning-message-id"
        input.parentElement.appendChild(errorLabel);


        input.className = "row-is-invalid";
    }

    function setSuccessFor(input) {
        if (input.parentElement.getElementsByClassName('warning-message')[0] != null) {
            input.parentElement.removeChild(input.parentElement.getElementsByClassName('warning-message')[0]);
        }
        input.className = "row-is-valid";
    }

    function isLogin(login) {
        return /^[a-zA-Z]{8,}$/.test(login);
    }
    function isPassword(password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    }

    function entropy(d) {
        let stat = {}
        for (let i = 0; i < d.length; i++) {
            
            let m = d[i]
            if (m in stat){
                stat[m] += 1
            }
            else {
                stat[m] = 1
            }
        }
        let H = 0.0
        Object.entries(stat).forEach(([k,v]) => {
            pi = stat[k] / d.length
            H -= pi * Math.log2(pi)
        })
        return H
    }
});