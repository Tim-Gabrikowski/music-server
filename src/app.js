import express from "express";
import cors from "cors";
import * as logger from "./logger.js";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { initDB } from "./db.js";
import { startRecommedationImporting } from "./tools/recLoader.js";

process.on("uncaughtException", (error) => {
	logger.critical("MAIN", error);
});

let db = await initDB();
if (db !== true) logger.critical("MAIN", "Init DB failed: " + db);

const PORT = process.env.PORT || 3010;

const app = express();

app.use(cors());
app.use(express.json());

import songsRouter from "./routes/songs.js";
import artistsRouter from "./routes/artists.js";
import playlistsRouter from "./routes/playlists.js";
import streamRouter from "./routes/stream.js";

app.use("/songs", songsRouter);
app.use("/playlists", playlistsRouter);
app.use("/artists", artistsRouter);
app.use("/stream", streamRouter);
app.use("/static", express.static(path.join(__dirname, "static", "assets")));

app.listen(PORT, function () {
	logger.info("MAIN", "Application Listening on Port " + PORT);
});

// Runtime scedulers and tasks
startRecommedationImporting();
