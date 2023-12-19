import express from "express";
import { Artist, Song, Location } from "../db.js";
import ytdl from "ytdl-core";
import * as logger from "../logger.js";
import path from "path";
import { uploadFile } from "./upload.js";
import { inspect } from "util";
import {
	getInputType,
	getInputData,
	createSongData,
} from "../tools/input_converter.js";

function sanitize(s = "") {
	return s
		.replace(/\'/g, "&sq;")
		.replace(/\"/g, "&dq;")
		.replace(/\`/g, "&bt;");
}

import dotenv from "dotenv";
dotenv.config();

import { dirname } from "path";
import { fileURLToPath } from "url";
import Ffmpeg from "fluent-ffmpeg";
import fs from "fs";
const __dirname = dirname(fileURLToPath(import.meta.url));

let router;
export default router = express.Router();

router.get("/", (req, res) => {
	res.send({ ok: true, route: "/songs", method: "GET" });
});

router.get("/share/:key", async (req, res) => {
	let songKey = req.params.key;
	let song = await Song.findOne({
		where: { key: songKey },
		include: [Artist, Location],
	});

	if (song == undefined || song == null)
		return res.status(404).send({ ok: false, message: "Song not found" });

	//load and render
	let html = fs.readFileSync(
		path.join(__dirname, "..", "static", "share", "index.html")
	);
	let content = sanitize(JSON.stringify(song));
	let out = html
		.toString()
		.replace("--DATA--", content)
		.replace(
			"--OG:TITLE--",
			`${sanitize(song.title)} by ${sanitize(song.Artist.name)}`
		)
		.replace("--OG:IMAGE--", sanitize(song.thumbnail))
		.replace(
			"--OG:AUDIO--",
			song.Locations.find((l) => l.type == "stream").path || ""
		)
		.replace("--MUSIC:DURATION--", song.seconds)
		.replace("--MUSIC:MUSICAN--", sanitize(song.Artist.name))
		.replace("--OG:URL--", process.env.HOST + "/songs/share/" + song.key);
	res.send(out);
});

router.get("/list", async (req, res) => {
	let songs = await Song.findAll({ include: [Artist, Location] });
	res.send(songs);
});

router.get("/id/:id", async (req, res) => {
	let { id } = req.params;

	let song = await Song.findByPk(id, { include: [Artist, Location] });

	if (song == undefined || song == null)
		return res.status(404).send({ ok: false, message: "Song not found" });

	res.send(song);
});

router.get("/key/:key", async (req, res) => {
	let { key } = req.params;

	let song = await Song.findOne({
		where: { key: key },
		include: [Artist, Location],
	});

	if (song == undefined || song == null)
		return res.status(404).send({ ok: false, message: "Song not found" });

	res.send(song);
});

router.post("/add-song", async (req, res) => {
	let { key } = req.body;

	await addSong(key, (result) => res.send(result));
});

router.post("/add-songs", async (req, res) => {
	let { keys } = req.body;

	let results = [];

	for (let i = 0; i < keys.length; i++) {
		const k = keys[i];
		await addSong(k, (result) => {
			results.push(result);
			if (results.length == keys.length) return res.send(results);
		});
	}
});

router.get("/get-data", async (req, res) => {
	const { input } = req.query;

	let type = await getInputType(input);
	let data = await getInputData(input, type);

	res.send({ type: type, data: data });
});

router.post("/redownload", async (req, res) => {
	const { key } = req.body;
	console.log(req.body);
	if (!(await songWithKeyExists(key))) return res.redirect(307, "./add-song");

	let song = await Song.findOne({
		where: { key: key },
		include: [Artist, Location],
	});

	// download file
	let tmpFilePath = path.join(__dirname, `../../music/${key}.mp3`);
	let yt_stream = ytdl(key, {
		quality: "highestaudio",
	});
	Ffmpeg(yt_stream)
		.save(tmpFilePath)
		.on("end", async () => {
			let result = await uploadFile(tmpFilePath);
			if (result.ok) {
				let loc = await Location.findOne({
					where: { SongId: song.id, type: "stream" },
				});

				if (loc == undefined || loc == null) {
					await song.createLocation({
						type: "stream",
						path:
							process.env.FILESERVER_URL +
								"/download/stream/" +
								result.result.file.id || "",
					});
				} else {
					loc.dataValues.path =
						process.env.FILESERVER_URL +
						"/download/stream/" +
						result.result.file.id;

					await Location.update(
						{
							path:
								process.env.FILESERVER_URL +
								"/download/stream/" +
								result.result.file.id,
						},
						{
							where: {
								id: loc.id,
							},
						}
					);
				}

				fs.rmSync(tmpFilePath);
				// reload all the associations and songdata and send to client
				await song.reload({ include: [Artist, Location] });
				res.send(song);
			} else {
				// reload all the associations and songdata and send to client
				logger.error("REDOWNLOAD", inspect(result));
				await song.reload({ include: [Artist, Location] });
				res.status(500).send(song);
			}
		})
		.on("error", async (err) => {
			logger.error("REDOWNLOAD", err);
			await song.reload({ include: [Artist, Location] });
			res.status(500).send(song);
		});
});

async function songWithKeyExists(key) {
	let song = await Song.findOne({ where: { key: key } });

	return !(song == undefined || song == null);
}
async function artistWithKeyExists(key) {
	let artist = await Artist.findOne({ where: { key: key } });

	return !(artist == undefined || artist == null);
}

async function addSong(key, cb) {
	if (await songWithKeyExists(key)) {
		return cb(
			await Song.findOne({
				where: { key: key },
				include: [Artist, Location],
			})
		);
	}

	let sData = await createSongData(key);
	console.log(sData);

	let artist;
	if (await artistWithKeyExists(sData.artist.key)) {
		artist = await Artist.findOne({ where: { key: sData.artist.key } });
	} else {
		artist = await Artist.build(sData.artist).save();
	}

	let song = await Song.build(sData).save();

	await song.createLocation({
		type: "youtube",
		path: sData.url,
	});

	await song.createLocation({
		type: "youtube_embed",
		path: sData.embedUrl,
	});

	await artist.addSong(song);

	// download file
	let tmpFilePath = path.join(__dirname, `../../music/${sData.key}.mp3`);
	let yt_stream = ytdl(sData.key, {
		quality: "highestaudio",
	});
	Ffmpeg(yt_stream)
		.save(tmpFilePath)
		.on("end", async () => {
			let result = await uploadFile(tmpFilePath);
			if (result.ok) {
				await song.createLocation({
					type: "stream",
					path:
						process.env.FILESERVER_URL +
							"/download/stream/" +
							result.result.file.id || "",
				});
				fs.rmSync(tmpFilePath);
				// reload all the associations and songdata and send to client
				await song.reload({ include: [Artist, Location] });
				cb(song);
			} else {
				// reload all the associations and songdata and send to client
				logger.error("REDOWNLOAD", inspect(result));
				await song.reload({ include: [Artist, Location] });
				cb(song);
			}
		})
		.on("error", async (err) => {
			logger.error("REDOWNLOAD", err);
			await song.reload({ include: [Artist, Location] });
			cb(song);
			console.log(err);
		});
}
