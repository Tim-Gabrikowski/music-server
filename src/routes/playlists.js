import express from "express";
import { Artist, Song, Location, Playlist, PlaylistSong } from "../db.js";
import { col } from "sequelize";
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
		include: [
			{
				model: Song,
				include: [Location, Artist],
			},
		],
		order: [[col("Songs.PlaylistSong.time"), "ASC"]],
	});

	if (list == undefined || list == null)
		return res
			.status(404)
			.send({ ok: false, message: "Playlist not found" });

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

	if (req.body.songs instanceof Array && req.body.songs.length > 0) {
		let thn = false;
		for (let i = 0; i < req.body.songs.length; i++) {
			const key = req.body.songs[i];
			let song = await Song.findOne({ where: { key: key } });

			if (song != null) {
				if (!thn) {
					await Playlist.update(
						{ thumbnail: song.dataValues.thumbnail },
						{ where: { key: list.dataValues.key } }
					);
					thn = true;
				}
				await PlaylistSong.create({
					PlaylistId: list.dataValues.id,
					SongId: song.dataValues.id,
				});
			}
		}
	}

	await list.reload({
		include: [{ model: Song, include: [Artist] }],
		order: [[col("Songs.PlaylistSong.time"), "ASC"]],
	});
	res.send(list);
});

router.put("/edit", async (req, res) => {
	let listKey = req.body.playlist;
	let { title, description } = req.body;

	let list = await Playlist.findOne({ where: { key: listKey } });

	if (list == undefined || list == null)
		return res
			.status(404)
			.send({ ok: false, message: "Playlist not found" });

	await list.set("title", title).set("description", description).save();

	await list.reload({
		include: [{ model: Song, include: [Artist, Location] }],
		order: [[col("Songs.PlaylistSong.time"), "ASC"]],
	});
	res.send(list);
});

router.put("/add-to-list", async (req, res) => {
	let keys = req.body.songs;
	let listKey = req.body.playlist;

	let list = await Playlist.findOne({ where: { key: listKey } });

	if (list == undefined || list == null)
		return res
			.status(404)
			.send({ ok: false, message: "Playlist not found" });

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];

		let song = await Song.findOne({ where: { key: key } });

		if (song == undefined || song == null)
			return res
				.status(404)
				.send({ ok: false, message: "Song not found" });
		let ps = await PlaylistSong.findOne({
			where: {
				PlaylistId: list.dataValues.id,
				SongId: song.dataValues.id,
			},
		});
		if (ps === null || ps == undefined) {
			await PlaylistSong.create({
				PlaylistId: list.dataValues.id,
				SongId: song.dataValues.id,
			});
		}
	}

	await list.reload({
		include: [{ model: Song, include: [Location, Artist] }],
		order: [[col("Songs.PlaylistSong.time"), "ASC"]],
	});

	res.send(list);
});

router.put("/remove-from-list", async (req, res) => {
	let songKey = req.body.song;
	let playlistKey = req.body.playlist;

	let song = await Song.findOne({ where: { key: songKey } });
	let playlist = await Playlist.findOne({ where: { key: playlistKey } });

	if (playlist == undefined || playlist == null)
		return res
			.status(404)
			.send({ ok: false, message: "Playlist not found" });

	if (song == undefined || song == null)
		return res.status(404).send({ ok: false, message: "Song not found" });

	await playlist.removeSong(song);

	await playlist.reload({
		include: [{ model: Song, include: [Location, Artist] }],
		order: [[col("Songs.PlaylistSong.time"), "ASC"]],
	});

	res.send(playlist);
});
