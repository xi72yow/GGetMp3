const { contextBridge, ipcRenderer } = require("electron");
//const ipcRenderer = electron.ipcRenderer;
let xAlerts = new xAlert();
var click = 0;

let inputHint = document.getElementById('input-url');

//usage hint
function giMeHint() {
    if (click < 4) {
        setTimeout(() => {
            xAlerts.send("hit enter to start", "dark", 2000);
        }, 500);
    }
    click++;
}

inputHint.addEventListener('click', giMeHint, false);

//usage bonus
let btn = document.getElementById("download-btn")
btn.addEventListener("click", sendInputToMain, false);

let input = document.getElementById("input-url");
input.addEventListener("keyup", ({ key }) => {
    if (key === "Enter") {
        sendInputToMain();
    }
})

function notifyForUsr(msg) {
    xAlerts.send(msg, "dark", 2000);
}

function errorForUsr(err) {
    currentProcess = false;
    xAlerts.send(err, "prime", 2000);
    toggleLoading();
}

function toggleLoading(id) {
    let spinner = document.getElementById(id);
    spinner.classList.toggle("d-none");
}

let currentProcess = false;

async function sendInputToMain() {

    let url = document.getElementById('input-url').value;

    if (!currentProcess) {

        if (!url == "") {
            //toggleLoading("loading");
            currentProcess = true;

            ipcRenderer.send('new-job', url);
            return;
        } else {
            xAlerts.send("please enter a valid url", "second", 2000);
        }

        return;
    }
    else {
        xAlerts.send("there is work..", "second", 2000);
    }

    //let data = await window.electron.ipcRenderer.invoke('read-file', loadedFilePath)
}



ipcRenderer.on('job-done-notice', function (event, msg) {
    //alert("sssss")
    currentProcess = false;
    xAlerts.send(msg, "dark", 2000);
    console.log(msg);
});

ipcRenderer.on('job-done-err', function (event, err) {
    currentProcess = false;
    xAlerts.send(err, "prime", 2000);
    console.log(err);
});
ipcRenderer.on('job-done-success', function (event, msg) {
    currentProcess = false;
    xAlerts.send(msg, "dark", 2000);
    console.log(msg);
});



