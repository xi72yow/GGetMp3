const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
let mainWindow = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 500,
    title: "GGetMp3",
    webPreferences: {
      worldSafeExecuteJavaScript: true,
      contextIsolation: false,
      nodeIntegration: true,
      //preload: path.join(app.getAppPath(), 'preload.js'),
      icon: path.join(app.getAppPath(), "src/assets/512x512.png"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // remove the menue
  mainWindow.removeMenu();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const request = require("request");
const NodeID3 = require("node-id3");
const { shell } = require("electron");

function getYear(crazySyle) {
  return crazySyle.split("-")[0];
}

function getMp3fromYTURL(url) {
  let folder = new Date().toString();

  if (!fs.existsSync("temp")) {
    fs.mkdirSync("temp");
  }

  if (!fs.existsSync("extract")) {
    fs.mkdirSync("extract");
  }

  if (!fs.existsSync("temp/" + folder)) {
    fs.mkdirSync("temp/" + folder);
  }

  const video = ytdl(url);

  video.on("info", function (info) {
    titleData = {
      title: info.videoDetails.title.replace(
        /[` ~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi,
        ""
      ),
      author: info.videoDetails.author.name,
      album: info.videoDetails.keywords ? info.videoDetails.keywords[0] : "",
      year: getYear(info.videoDetails.publishDate),
      thumbnail: info.videoDetails?.thumbnails[0],
      comment: info.videoDetails.video_url,
      genre: info.videoDetails.category,
    };
    onNotify(JSON.stringify(titleData));
    console.log(titleData);

    // stringify Object
    var jsonContent = JSON.stringify(info);

    fs.writeFile(
      "temp/" + folder + "/output.json",
      jsonContent,
      "utf8",
      function (err) {
        if (err) {
          console.log("An error occured while writing JSON Object to File.");
          onNotify("An error occured while writing JSON Object to File.");
          return console.log(err);
        }
        onNotify("JSON file has been saved.");
        console.log("JSON file has been saved.");
      }
    );
  });

  function convert(input, output, callback) {
    ffmpeg(input)
      .output(output)
      .on("end", function () {
        console.log("conversion ended");
        onNotify("conversion ended");
        callback(null);
      })
      .on("error", function (err) {
        console.log("error: ", err.code, err.msg);
        onNotify("convert error");
        callback(err);
      })
      .run();
  }

  function download(uri, filename, callback) {
    request.head(uri, function (err, res, body) {
      console.log(err);
      console.log("content-type:", res.headers["content-type"]);
      console.log("content-length:", res.headers["content-length"]);
      onNotify("requested: " + res.headers["content-type"]);

      request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
    });
  }

  var vidStream = fs.createWriteStream("temp/" + folder + "/myvideo.mp4");

  video.pipe(vidStream);

  vidStream.on("finish", function () {
    console.log("file done");
    onNotify("file done");

    convert(
      "temp/" + folder + "/myvideo.mp4",
      "extract/" + titleData.title + ".mp3",
      function (err) {
        if (!err) {
          console.log("conversion complete");
          onNotify("conversion complete");
          download(
            titleData.thumbnail,
            "temp/" + folder + "/cover.webp",
            function (err) {
              if (!err) {
                convert(
                  "temp/" + folder + "/cover.webp",
                  "temp/" + folder + "/x.png",
                  function (err) {
                    if (!err) {
                      const tags = {
                        title: titleData.title,
                        artist: titleData.author,
                        album: titleData.album,
                        genre: titleData.genre,
                        year: titleData.year,
                        comment: titleData.comment,
                        APIC: "./temp/" + folder + "/x.png",
                      };

                      const success = NodeID3.write(
                        tags,
                        "./extract/" + titleData.title + ".mp3"
                      );
                      console.log("sucess: " + success);
                      onNotify("id3 tag state: " + success);

                      shell.openPath("./extract");
                      onSuccsess();
                      return;
                    } else {
                      onError(err);
                      throw err;
                    }
                  }
                );
                return;
              } else {
                onError(err);
                throw err;
              }
            }
          );
          return;
        } else {
          onError(err);
          throw err;
        }
      }
    );
  });
}

function onNotify(msg) {
  mainWindow.webContents.send("job-done-notice", msg);
}

function onError(err) {
  mainWindow.webContents.send("job-done-err", err);
}

function onSuccsess() {
  mainWindow.webContents.send("job-done-success", "success!");
}

ipcMain.on("new-job", function (event, url) {
  console.log(url);
  getMp3fromYTURL(url);
});

function processInput(url) {}
