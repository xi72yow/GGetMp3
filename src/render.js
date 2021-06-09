//boosttrap tooltips enable all
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
})

let currentProcess = false;

function onError(err) {
    currentProcess = false;
    alert("Error:" + err);
}

function toggleLoading(id) {
    let spinner = document.getElementById(id);
    spinner.classList.toggle("d-none");
}

const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg')
const request = require('request');
const NodeID3 = require('node-id3');
const { shell } = require('electron');

function getYear(crazySyle) {
    return crazySyle.split('-')[0]
}

async function getMp3fromYTURL(url) {

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

    video.on('info', function (info) {

        titleData = {
            "title": info.videoDetails.title,
            "author": info.videoDetails.author.name,
            "album": info.videoDetails.keywords[0],
            "year": getYear(info.videoDetails.publishDate),
            "thumbnail": info.videoDetails.thumbnails[0],
            "comment": info.videoDetails.video_url,
            "genre": info.videoDetails.category,
        }
        console.log(titleData);

        // stringify Object
        var jsonContent = JSON.stringify(info);

        fs.writeFile("temp/" + folder + "/output.json", jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }

            console.log("JSON file has been saved.");
        });

    });

    function convert(input, output, callback) {
        ffmpeg(input)
            .output(output)
            .on('end', function () {
                console.log('conversion ended');
                callback(null);
            }).on('error', function (err) {
                console.log('error: ', err.code, err.msg);
                callback(err);
            }).run();
    }

    function download(uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);

            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };

    var vidStream = fs.createWriteStream("temp/" + folder + '/myvideo.mp4');

    video.pipe(vidStream);

    vidStream.on('finish', function () {

        console.log('file done');

        convert("temp/" + folder + '/myvideo.mp4', 'extract/' + titleData.title + '.mp3', function (err) {
            if (!err) {
                console.log('conversion complete');
                download(titleData.thumbnail, "temp/" + folder + '/cover.webp', function (err) {
                    if (!err) {
                        convert("temp/" + folder + '/cover.webp', "temp/" + folder + '/x.png', function (err) {
                            if (!err) {
                                const tags = {
                                    title: titleData.title,
                                    artist: titleData.author,
                                    album: titleData.album,
                                    genre: titleData.genre,
                                    year: titleData.year,
                                    comment: titleData.comment,
                                    APIC: "./temp/" + folder + "/x.png",
                                }

                                const success = NodeID3.write(tags, './extract/' + titleData.title + '.mp3');
                                console.log("sucess: " + success);
                                toggleLoading("loading");
                                shell.openPath('./extract');
                                currentProcess = false;
                                return;

                            } else {
                                onError(err);
                                throw err;
                            }

                        });
                        return;

                    } else {
                        onError(err);
                        throw err;
                    }
                });
                return;

            } else {
                onError(err);
                throw err;
            }

        });


    });
}

function processInput() {
    if (!currentProcess) {

        let url = document.getElementById("input-url").value;
        if (!url == "") {
            toggleLoading("loading");
            currentProcess = true;
            getMp3fromYTURL(url);
            return;
        } else {
            alert("please enter a valid URL")
        }

        return;
    }
    else {

    }

}

let btn = document.getElementById("download")
btn.addEventListener("click", processInput, false);
let input = document.getElementById("input-url");
input.addEventListener("keyup", ({ key }) => {
    if (key === "Enter") {
        processInput()
    }
})

