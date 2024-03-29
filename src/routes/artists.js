import express from "express";
import { Artist, Song } from "../db.js";
import { authMiddleware } from "../middlewares/auth.js";

let router;
export default router = express.Router();

router.get("/list", authMiddleware, async (req, res) => {
	let artists = await Artist.findAll();
	res.send(artists);
});

router.get("/id/:id", authMiddleware, async (req, res) => {
	let { id } = req.params;

	let artist = await Artist.findByPk(id, { include: [Song] });

	if (artist == undefined || artist == null) return res.sendStatus(404);

	res.send(artist);
});

router.get("/key/:key", authMiddleware, async (req, res) => {
	let { key } = req.params;

	let artist = await Artist.findOne({
		where: { key: key },
		include: [Song],
	});

	if (artist == undefined || artist == null) return res.sendStatus(404);

	res.send(artist);
});
