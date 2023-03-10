const readline = require("readline");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");

function downloadMP3(id) {
	let stream = ytdl(id, {
		quality: "highestaudio",
	});

	let start = Date.now();
	ffmpeg(stream)
		.audioBitrate(128)
		.save(`${__dirname}/${id}.mp3`)
		.on("progress", (p) => {
			readline.cursorTo(process.stdout, 0);
			process.stdout.write(`${p.targetSize}kb downloaded`);
		})
		.on("end", () => {
			console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
		});
}

downloadMP3("dQw4w9WgXcQ");
downloadMP3("henzKOC78nw");
