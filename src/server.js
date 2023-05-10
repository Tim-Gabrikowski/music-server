var express = require("express");
var app = express();
const fs = require("fs");
const readline = require("readline");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");
require("dotenv").config();
const types = require("./inputTypes");
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");

const PATH_TO_INDEXFILE = path.join(__dirname, "../music/index.json");
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3010;
const SERVER_URL =
	process.env.NO_PORT_EXPOSE == "yes" ? HOST : HOST + ":" + PORT;

if (!fs.existsSync(PATH_TO_INDEXFILE)) {
	fs.writeFileSync(PATH_TO_INDEXFILE, "[]");
}

app.use(express.json());
app.use(cors());

app.listen(PORT, function () {
	console.log("[NodeJS] Application Listening on Port " + PORT);
});
app.get("/", (req, res) => {
	var html = fs.readFileSync(`${__dirname}/static/index.html`);
	html = String(html).replace("--HOST--", SERVER_URL);
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
		.save(path.join(__dirname, `../music/${videoId}.mp3`))
		.on("progress", (p) => {})
		.on("end", async () => {
			console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);

			res.send({
				message: "done",
				key: videoId,
			});

			const form = new FormData();
			const buffer = fs.readFileSync(
				path.join(__dirname, `../music/${videoId}.mp3`)
			);
			const fileName = videoId + ".mp3";

			form.append("file", buffer, {
				contentType: "text/plain",
				name: "file",
				filename: fileName,
			});

			fetch("http://localhost:3030/files/upload", {
				method: "POST",
				body: form,
			})
				.then((res) => res.json())
				.then((json) => {
					let filesList = [];
					filesList = JSON.parse(fs.readFileSync(PATH_TO_INDEXFILE));
					filesList.push({
						key: videoId,
						title: title,
						publisher: publisher,
						filename: videoId + ".mp3",
						file: json.file,
					});
					fs.writeFileSync(PATH_TO_INDEXFILE, JSON.stringify(filesList));
				});
		});
});

app.get("/analyse", async (req, res) => {
	const input = req.query.input;
	let input_type = getInputType(input);
	res.send({
		input: input,
		type: getInputType(input),
		data: await getInputData(input, input_type),
	});
});

app.get("/play/:key", function (req, res) {
	var key = req.params.key;

	let indexfile = fs.readFileSync(PATH_TO_INDEXFILE);
	let index = JSON.parse(indexfile);

	let song = index.filter((e) => e.key == key)[0];
	if (song == undefined) return res.sendStatus(404);
	console.log(song);
	if (song.file !== undefined) {
		console.log("redirecting");
		return res.redirect(
			"http://localhost:3030/download/stream/" + song.file.id,
			301
		);
	}

	var music = path.join(__dirname, `../music/${key}.mp3`);

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

/* UTIL */

function getInputType(link) {
	let out = "";

	// video id
	if (/^.{11}$/.test(link)) {
		out = types.VIDEO_ID;

		// playlist id
	} else if (/^.{34}$/.test(link)) {
		out = types.PLAYLIST_ID;

		// playlist link
	} else if (
		/(http|https):\/\/(www\.|)youtube\.com\/playlist\?list=.{34}/.test(link)
	) {
		out = types.PLAYLIST_LINK;

		// mixed link
	} else if (
		/(http|https):\/\/(www\.|)youtube\.com\/watch\?v=.{11}&list=.{34}&.*/.test(
			link
		)
	) {
		out = types.MIXED_LINK;

		// video link
	} else if (
		/(http|https):\/\/(www\.|)youtube\.com\/watch\?v=.{11}$/.test(link)
	) {
		out = types.VIDEO_LINK;

		// short video link
	} else if (/(http|https):\/\/youtu\.be\/.{11}$/.test(link)) {
		out = types.SHORT_LINK;

		// unknown
	} else {
		out = "unknown";
	}
	return out;
}

async function getInputData(input, type) {
	let data = {};

	switch (type) {
		case types.VIDEO_ID:
			data = { videoId: input, video: await ytdl.getBasicInfo(input) };
			break;

		case types.PLAYLIST_ID:
			data = { playlistId: input, playlist: await ytpl(input) };
			break;

		case types.PLAYLIST_LINK:
			let pid_s = input.replace(
				/^(http|https):\/\/(www\.|)youtube\.com\/playlist\?list=/,
				""
			);
			data = {
				playlistId: pid_s,
				playlist: await ytpl(pid_s),
			};
			break;

		case types.MIXED_LINK:
			let lastChunk = input.replace(
				/^(http|https):\/\/(www\.|)youtube\.com\/watch\?v=/,
				""
			);
			let vid_m = lastChunk.replace(/&list=.{34}&.*$/, "");
			let pid_m = lastChunk.replace(/^(.{11}&list=)/, "").replace(/(&.*)$/, "");
			data = {
				videoId: vid_m,
				video: await ytdl.getBasicInfo(vid_m),
				playlistId: pid_m,
				playlist: await ytpl(pid_m),
			};
			break;

		case types.VIDEO_LINK:
			let vid_s = input.replace(
				/^(http|https):\/\/(www\.|)youtube\.com\/watch\?v=/,
				""
			);
			data = {
				videoId: vid_s,
				video: await ytdl.getBasicInfo(vid_s),
			};
			break;

		case types.SHORT_LINK:
			let vid_sl = input.replace(/^(http|https):\/\/youtu\.be\//, "");
			data = {
				videoId: vid_sl,
				video: await ytdl.getBasicInfo(vid_sl),
			};
			break;

		default:
			data = {};
			break;
	}
	return data;
}
