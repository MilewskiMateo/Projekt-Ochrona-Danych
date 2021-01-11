document.addEventListener('DOMContentLoaded', function (event) {

    const POST = "POST";
    const URL = "https://localhost/try";

    let secretNoteForm = document.getElementById('secret-note-form');
    document.getElementById("button-reg-form").className = "submit-button-available";
       
    secretNoteForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitNewShipForm(); 
    });
    
    function submitNewShipForm() {
        let fetchParams = {
            method: POST,
            body: new FormData(secretNoteForm),
        };
    
        fetch(URL, fetchParams)
            .then(response => { if (response.redirected) { window.location.href = response.url } else { return response.json() } })
            .then(response =>  { setErrorFor(document.getElementById('button-reg-form'), response['responseMessage']) })
            .catch(err => {
                console.log("Caught error: " + err);
            });
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


        input.className = "row-is-invalid";
    }
})

