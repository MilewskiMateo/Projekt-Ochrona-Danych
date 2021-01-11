document.addEventListener('DOMContentLoaded', function (event) {
    

    const POST = "POST";
    const URL = "https://localhost/login/log";
    var formValidationList = [false, false];
    var EnableRegistration = false;
    
    let loginForm = document.getElementById("login-form");
    let login = document.getElementById('login');
    let password = document.getElementById('password');
    
    
    
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
    
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (EnableRegistration) {
            submitLoginForm();
            login.value = ""
            password.value = ""
            formValidationProxy[0] = false;
            formValidationProxy[1] = false;
            document.getElementById("button-reg-form").className = "submit-button-not-available";
        }
    }
    );
    
    function submitLoginForm() {
        let loginParams = {
            method: POST,
            credentials: 'include',
            body: new FormData(loginForm),
            
        };
    
        fetch(URL, loginParams)
            .then(response => { if (response.redirected) { window.location.href = response.url } else { return response.json() } })
            .then(response => {handleResponse(response) })
            .catch(err => {
                console.log("Caught error: " + err);
            });
    }

    login.addEventListener('change', (event) => {
        const loginValue = login.value.trim();
        if (loginValue === '') {
            setErrorFor(login, 'Login jest pusty');
            formValidationProxy[0] = false;
        } else {
            setSuccessFor(login);
            formValidationProxy[0] = true;
        }
    });
    
    password.addEventListener('change', (event) => {
        const passwordValue = password.value.trim();
        if (passwordValue === '') {
            setErrorFor(password, 'Hasło jest puste');
            formValidationProxy[1] = false;
        } else {
            setSuccessFor(password);
            formValidationProxy[1] = true;
        }
    });

    function handleResponse (response){
        setErrorFor(document.getElementById('button-reg-form'),response['responseMessage']);
        if(response['ip'] !== undefined){
             console.log(response['ip']);
        }
        if(response['honeypot'] !== undefined){
          console.log(response['honeypot']);
        }
    }



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