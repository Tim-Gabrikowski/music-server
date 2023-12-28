import express from "express";
import ytdl from "ytdl-core";
import * as logger from "../logger.js";
import { Writable } from "stream";
import ffmpeg from "fluent-ffmpeg";
import { Song, Location } from "../db.js";

let router;
export default router = express.Router();

router.get("/:key", async (req, res) => {
	// check for key given
	if (!req.params.key) return res.status(400).send();

	let song = await Song.findOne({
		where: { key: req.params.key },
		include: [Location],
	});

	if (song) {
		let loc = song.Locations.find((obj) => obj.type === "fileserver");
		// TODO: Log listened to users history
		if (loc !== undefined) return res.redirect(307, loc.path);
	} else {
		// TODO: Take Song into lib
	}

	// create Readable Stream with youtube video
	let yt_stream = ytdl(req.params.key, {
		quality: "highestaudio",
	});

	// End uplink on error
	yt_stream.on("error", (err) => {
		logger.error("STREAM", "YTDL: " + err);
		res.end();
	});

	// set response Headers
	res.setHeader("Content-Type", "audio/mpeg");
	res.setHeader("Transfer-Encoding", "chunked");

	// create Writable Stream as output for ffmpeg
	const f_out_stream = new Writable();

	// extract the audio from the yt_stream to the output stream
	ffmpeg(yt_stream)
		.output(f_out_stream)
		.outputFormat("mp3")
		.on("end", () => {
			f_out_stream.close();
		})
		.run();

	// End uplink on error
	f_out_stream.on("error", (err) => {
		logger.error("STREAM", "FFMPEG: " + err);
		res.end();
	});

	// Send each chunk from FFMPEG via the Writestream to the response stream
	f_out_stream._write = (c, e, next) => {
		res.write(c);
		next();
	};
	f_out_stream._final = (err) => {
		res.send();
	};
});
