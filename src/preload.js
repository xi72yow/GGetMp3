const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
    "electron",
    {
        ipcRenderer: ipcRenderer,
        doThing: () => ipcRenderer.send('do-a-thing'),

        doNotice: () => ipcRenderer.on('job-done-notice', function (event, msg) {
            alert("sssss")
            window.xAlerts.send(msg, "dark", 2000);
            console.log(msg);
        }),

        doErr: () => ipcRenderer.on('job-done-err', function (event, err) {
            xAlerts.send(err, "prime", 2000);
            console.log(err);
        }),

        doSuccess: () => ipcRenderer.on('job-done-success', function (event, msg) {
            xAlerts.send(msg, "dark", 2000);
            console.log(msg);
        })
    }


);