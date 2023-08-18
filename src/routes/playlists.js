import express from "express";
import { Artist, Song, Location, Playlist } from "../db.js";
import * as logger from "../logger.js";
import { randomBytes } from "crypto";

let router;
export default router = express.Router();

router.get("/", (req, res) => {
	res.send({ ok: true, route: "/playlists", method: "GET" });
});

router.get("/list", async (req, res) => {
	let lists = await Playlist.findAll();
	res.send(lists);
});

router.get("/one/:key", async (req, res) => {
	let { key } = req.params;

	let list = await Playlist.findOne({
		where: { key: key },
		include: [{ model: Song, include: [Location, Artist] }],
	});

	if (list == undefined || list == null) return res.status(404).send();

	res.send(list);
});

router.post("/create", async (req, res) => {
	let key = randomBytes(12).toString("base64url");
	let list = await Playlist.build({
		key: key,
		title: req.body.title || "Playlist #" + key,
		description: req.body.description || "",
	}).save();

	list.dataValues.songCount = 0;

	if (req.body.songs instanceof Array) {
		for (let i = 0; i < req.body.songs.length; i++) {
			const key = req.body.songs[i];
			let song = await Song.findOne({ where: { key: key } });
			list.addSong(song);
		}
		list.dataValues.songCount = req.body.songs.length;
	}

	res.send(list);
});

router.put("/add-to-list", async (req, res) => {
	let keys = req.body.songs;
	let listKey = req.body.playlist;

	let list = await Playlist.findOne({ where: { key: listKey } });

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];

		let song = await Song.findOne({ where: { key: key } });

		await list.addSong(song);
	}

	await list.reload({
		include: [{ model: Song, include: [Location, Artist] }],
	});

	res.send(list);
});

router.put("/remove-from-list", async (req, res) => {
	let songKey = req.body.song;
	let playlistKey = req.body.playlist;

	let song = await Song.findOne({ where: { key: songKey } });
	let playlist = await Playlist.findOne({ where: { key: playlistKey } });

	await playlist.removeSong(song);

	await playlist.reload({
		include: [{ model: Song, include: [Location, Artist] }],
	});

	res.send(playlist);
});
