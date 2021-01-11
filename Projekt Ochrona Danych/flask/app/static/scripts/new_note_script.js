document.addEventListener('DOMContentLoaded', function (event) {

    const POST = "POST";
    const URL = "https://localhost/new_note/add";
    var formValidationList = [false, false];
    var EnableRegistration = false;
    let newNoteForm = document.getElementById('new-note-form');
    const passwordInput = document.getElementById('note_password')
    const title = document.getElementById('note_title')
    const note = document.getElementById('note')

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


    var radios = document.querySelectorAll('input[type=radio][name="type"]');
    radios.forEach(radio => radio.addEventListener('change', () => 
    {
        if(radio.checked = "true" && radio.id == 'secret'){      
            passwordInput.disabled = false                      
            console.log(passwordInput.disabled )            
        }else{     
            radio.checked = true
            passwordInput.value = ""
            passwordInput.disabled = true                       
        }
    }
    
    
    ));
    
    newNoteForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (EnableRegistration) {
        submitNewShipForm(); 
        passwordInput.value = ""
        title.value = ""
        note.value =""
        formValidationProxy[0] = false;
        formValidationProxy[1] = false;
        document.getElementById("button-reg-form").className = "submit-button-not-available";
        }
    });
    
    function submitNewShipForm() {
        let fetchParams = {
            method: POST,
            body: new FormData(newNoteForm),
        };
    
        fetch(URL, fetchParams)
            .then(response => { if (response.redirected) { window.location.href = response.url } else { return response.json() } })
            .then(response => {  setErrorFor(document.getElementById('button-reg-form'),response['responseMessage'])})
            .catch(err => {
                console.log("Caught error: " + err);
            });
    }

    title.addEventListener('change', (event) => {
        const titleValue = title.value;
        if (titleValue === '') {
            setErrorFor(title, 'Tytuł jest pusty');
            formValidationProxy[0] = false;
        } else {
            setSuccessFor(title);
            formValidationProxy[0] = true;
        }
    });
    
    note.addEventListener('change', (event) => {
        const noteValue = note.value;
        if (noteValue === '') {
            setErrorFor(note, 'Zawartość notatki jest pusta');
            formValidationProxy[1] = false;
        } else {
            setSuccessFor(note);
            formValidationProxy[1] = true;
        }
    });




    function setErrorFor(input, message) {
        if (input.parentElement.getElementsByClassName('warning-message')[0] != null) {
            input.parentElement.removeChild(input.parentElement.getElementsByClassName('warning-message')[0]);
        }
        var errorLabel = document.createElement("label");

        errorLabel.appendChild(document.createTextNode(message));
        errorLabel.className = "warning-message"
        errorLabel.id = "warning-message-id"
        input.parentElement.appendChild(errorLabel);
        

       if(input.type==='text'){ input.className = "row-is-invalid"};
    }

    function setSuccessFor(input) {
        if (input.parentElement.getElementsByClassName('warning-message')[0] != null) {
            input.parentElement.removeChild(input.parentElement.getElementsByClassName('warning-message')[0]);
        }
        input.className = "row-is-valid";
    }

})