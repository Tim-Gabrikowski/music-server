import express from "express";
import { Artist, Song, Location } from "../db.js";
import ytdl from "ytdl-core";
import path from "path";
import { uploadFile } from "./upload.js";

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

	if (await songWithKeyExists(key)) {
		return res.send(
			await Song.findOne({
				where: { key: key },
				include: [Artist, Location],
			})
		);
	}

	let sData = await createSongData(key);

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
				res.send(song);
			}
		})
		.on("error", async (err) => {
			await song.reload({ include: [Artist, Location] });
			res.send(song);
		});
});

async function createSongData(ytKey) {
	let data = await ytdl.getBasicInfo(ytKey);

	let sData = {
		title: data.videoDetails.title,
		key: ytKey,
		seconds: data.videoDetails.lengthSeconds,
		url: data.videoDetails.video_url,
		embedUrl: data.videoDetails.embed.iframeUrl,
		thumbnail: getThumbnail(data.videoDetails.thumbnail.thumbnails).url,
		artist: {
			key: data.videoDetails.author.id,
			name: data.videoDetails.author.name,
			user: data.videoDetails.author.user,
			url: data.videoDetails.author.channel_url,
			thumbnail: getThumbnail(data.videoDetails.author.thumbnails).url,
		},
	};

	return sData;
}

async function songWithKeyExists(key) {
	let song = await Song.findOne({ where: { key: key } });

	return !(song == undefined || song == null);
}
async function artistWithKeyExists(key) {
	let artist = await Artist.findOne({ where: { key: key } });

	return !(artist == undefined || artist == null);
}

function getThumbnail(thumbnails) {
	let highest = 0;
	let best = {};
	for (let i = 0; i < thumbnails.length; i++) {
		const thumb = thumbnails[i];
		if (thumb.width > highest) {
			best = thumb;
			highest = thumb.width;
		}
	}
	return best;
}
