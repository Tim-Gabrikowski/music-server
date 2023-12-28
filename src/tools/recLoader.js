import { Recommendation, Song, Artist } from "../db.js";
import * as logger from "../logger.js";
import { createSongData } from "./input_converter.js";
const cron = await import("node-cron");
import dotenv from "dotenv";
dotenv.config();

const IMPORT_CRON = process.env.DYNAMIC_IMPORT_CRON || "*/5 * * * *";

export async function startRecommedationImporting() {
	logger.info("RECIMP", "Starting Recommendation Importer");
	await importRecommendations();
	logger.info(
		"RECIMP",
		"All left over Recommendations are now imported properly"
	);
	// TODO: add sceduler that imports new Recommendations in a certain period of time
	logger.info(
		"RECIMP",
		"Scedule new Recommendation imports. CRON: " + IMPORT_CRON
	);
	cron.schedule(IMPORT_CRON, async () => {
		logger.info(
			"RECIMP",
			"Start sceduled automatic import of recommendations"
		);
		await importRecommendations();
		logger.info(
			"RECIMP",
			"All left over Recommendations are now imported properly"
		);
	});
}

async function importRecommendations() {
	// Get list of Recommendations which songs are not imported yet.
	let recsToCheck = await getListOfRecommendationsToImport();
	logger.info(
		"RECIMP",
		recsToCheck.length + " Recommendations need to be checked"
	);
	// Get a list of all the songs to reduce duplicates
	let songsToImportSet = new Set();
	for (let i = 0; i < recsToCheck.length; i++) {
		const rec = recsToCheck[i];
		let o = { key: rec.recommendsKey, id: 0 };
		if (!songsToImportSet.has(o)) songsToImportSet.add(o);
	}

	let songs = [];
	for (let song of songsToImportSet) {
		let sData = await createSongData(song.key);

		let artist = await Artist.findOne({ where: { key: sData.artist.key } });
		if (!artist) {
			artist = await Artist.build(sData.artist).save();
		}

		let dbSong = await Song.findOne({ where: { key: song.key } });
		if (dbSong) {
			songs.push(dbSong);
		} else {
			dbSong = await Song.build(sData).save();

			await dbSong.createLocation({
				type: "youtube",
				path: sData.url,
			});

			await dbSong.createLocation({
				type: "youtube_embed",
				path: sData.embedUrl,
			});
			await dbSong.createLocation({
				type: "stream",
				path: process.env.HOST + "/stream/" + dbSong.key,
			});

			await artist.addSong(dbSong);
			songs.push(dbSong);
		}
	}
	// link song to the recommendation
	for (let i = 0; i < recsToCheck.length; i++) {
		const rec = recsToCheck[i];
		let song = songs.find((s) => s.key == rec.recommendsKey);
		rec.recommendedSongId = song.id;
		await rec.save();
	}
}

async function getListOfRecommendationsToImport() {
	return Recommendation.findAll({
		where: { recommendedSongId: null },
	});
}