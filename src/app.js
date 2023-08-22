import express from "express";
import cors from "cors";
import * as logger from "./logger.js";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3010;

const app = express();

app.use(cors());
app.use(express.json());

import songsRouter from "./routes/songs.js";
import artistsRouter from "./routes/artists.js";
import playlistsRouter from "./routes/playlists.js";

app.use("/songs", songsRouter);
app.use("/playlists", playlistsRouter);
app.use("/artists", artistsRouter);
app.use("/static", express.static(path.join(__dirname, "static", "assets")));

app.listen(PORT, function () {
	logger.info("MAIN", "Application Listening on Port " + PORT);
});

process.on("uncaughtException", (error) => {
	logger.critical("MAIN", error);
});
