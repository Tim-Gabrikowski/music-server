import express from "express";
import ytdl from "ytdl-core";
import * as logger from "../logger.js";
import { Writable } from "stream";
import ffmpeg from "fluent-ffmpeg";
import { Song, Location, Artist } from "../db.js";
import { UPDATE_QUEUE } from "../services/recLoader.js";
import { createSongData } from "../tools/input_converter.js";

let router;
export default router = express.Router();

router.get("/:key", async (req, res) => {
	// check for key given
	if (!req.params.key) return res.status(400).send();

	let song = await Song.findOne({
		where: { key: req.params.key },
		include: [
			Location,
			{ model: Song, as: "recommendedSongs", include: [Artist] },
		],
	});

	if (song.recommendedSongs.length == 0) {
		let sData = await createSongData(song.key);
		UPDATE_QUEUE.add(sData);
	}

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
		logger.error(logger.NAMES.dirStream, "YTDL: " + err);
		res.end();
	});

	// set response Headers
	res.setHeader("Content-Type", "audio/mpeg");
	res.setHeader("Transfer-Encoding", "chunked");

	// create Writable Stream as output for ffmpeg
	const f_out_stream = new Writable();

	try {
		// extract the audio from the yt_stream to the output stream
		ffmpeg(yt_stream)
			.output(f_out_stream)
			.outputFormat("mp3")
			.on("end", () => {
				f_out_stream.end();
			})
			.run();

		// End uplink on error
		f_out_stream.on("error", (err) => {
			logger.error(logger.NAMES.dirStream, "FFMPEG: " + err);
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
	} catch (err) {
		logger.error(
			logger.NAMES.dirStream,
			"Direct Stream resulted in this error: " + err
		);
		res.status(500).send({ ok: false, err: "Server fucked up!" });
	}
});
