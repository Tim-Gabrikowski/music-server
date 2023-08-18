import express from "express";
import cors from "cors";
import * as logger from "./logger.js";

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

app.listen(PORT, function () {
	logger.info("MAIN", "Application Listening on Port " + PORT);
});

process.on("uncaughtException", (error) => {
	logger.critical("MAIN", error);
});
