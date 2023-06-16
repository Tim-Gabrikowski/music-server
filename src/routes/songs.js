import express from "express";
import { Artist, Song, Location } from "../db.js";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import path from "path";
import { uploadFile } from "./upload.js";
import {
	getInputType,
	getInputData,
	createSongData,
} from "../tools/input_converter.js";

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

router.get("/list", async (req, res) => {
	let songs = await Song.findAll();
	res.send(songs);
});

router.get("/id/:id", async (req, res) => {
	let { id } = req.params;

	let song = await Song.findByPk(id, { include: [Artist, Location] });

	if (song == undefined || song == null) return res.sendStatus(404);

	res.send(song);
});

router.get("/key/:key", async (req, res) => {
	let { key } = req.params;

	let song = await Song.findOne({
		where: { key: key },
		include: [Artist, Location],
	});

	if (song == undefined || song == null) return res.sendStatus(404);

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

	// let songs = [];

	// for (let i = 0; i < data.keys.length; i++) {
	// 	const key = data.keys[i];

	// 	let song = await createSongData(key);

	// 	songs.push(song);
	// }

	res.send({ type: type, data: data });
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
			console.log("try to upload file");
			let result = await uploadFile(tmpFilePath);
			console.log("fileupload result is there");
			console.log(result);
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
				await song.reload({ include: [Artist, Location] });
				cb(song);
			}
		})
		.on("error", async (err) => {
			await song.reload({ include: [Artist, Location] });
			cb(song);
		});
}
