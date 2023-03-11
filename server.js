var express = require("express");
var app = express();
var fs = require("fs");
const readline = require("readline");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");
require("dotenv").config();

const PATH_TO_INDEXFILE = `${__dirname}/music/index.json`;
const HOST = process.env.HOST;

if (!fs.existsSync(PATH_TO_INDEXFILE)) {
	fs.writeFileSync(PATH_TO_INDEXFILE, "[]");
}

app.use(express.json());
app.use(cors());

app.listen(3010, function () {
	console.log("[NodeJS] Application Listening on Port 3010");
});
app.get("/", (req, res) => {
	var html = fs.readFileSync(`${__dirname}/static/index.html`);
	html = String(html).replace("--HOST--", HOST);
	res.send(html);
});
app.use("/", express.static("./static"));
app.get("/list", (req, res) => {
	res.sendFile(PATH_TO_INDEXFILE);
});
app.post("/upload", (req, res) => {
	const { videoId, title, publisher } = req.body;
	console.log("downloading...", videoId);
	let stream = ytdl(videoId, {
		quality: "highestaudio",
	});

	let start = Date.now();
	ffmpeg(stream)
		.audioBitrate(128)
		.save(`${__dirname}/music/${videoId}.mp3`)
		.on("progress", (p) => {})
		.on("end", () => {
			console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
			let filesList = [];
			filesList = JSON.parse(fs.readFileSync(PATH_TO_INDEXFILE));
			filesList.push({
				key: videoId,
				title: title,
				publisher: publisher,
				filename: videoId + ".mp3",
			});
			fs.writeFileSync(PATH_TO_INDEXFILE, JSON.stringify(filesList));
			res.send({
				message: "done",
				key: videoId,
			});
		});
});

app.get("/play/:key", function (req, res) {
	var key = req.params.key;

	var music = "music/" + key + ".mp3";

	var stat = fs.statSync(music);
	range = req.headers.range;
	var readStream;

	if (range !== undefined) {
		var parts = range.replace(/bytes=/, "").split("-");

		var partial_start = parts[0];
		var partial_end = parts[1];

		if (
			(isNaN(partial_start) && partial_start.length > 1) ||
			(isNaN(partial_end) && partial_end.length > 1)
		) {
			return res.sendStatus(500); //ERR_INCOMPLETE_CHUNKED_ENCODING
		}

		var start = parseInt(partial_start, 10);
		var end = partial_end ? parseInt(partial_end, 10) : stat.size - 1;
		var content_length = end - start + 1;

		res.status(206).header({
			"Content-Type": "audio/mpeg",
			"Content-Length": content_length,
			"Content-Range": "bytes " + start + "-" + end + "/" + stat.size,
		});

		readStream = fs.createReadStream(music, { start: start, end: end });
	} else {
		res.header({
			"Content-Type": "audio/mpeg",
			"Content-Length": stat.size,
		});
		readStream = fs.createReadStream(music);
	}
	readStream.pipe(res);
});
