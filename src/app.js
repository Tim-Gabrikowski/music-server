import express from "express";
import cors from "cors";
import * as logger from "./logger.js";

const PORT = process.env.PORT || 3010;

const app = express();

app.use(cors());
app.use(express.json());

import songsRouter from "./routes/songs.js";
import artistsRouter from "./routes/artists.js";

app.use("/songs", songsRouter);
app.use("/artists", artistsRouter);

app.listen(PORT, function () {
	logger.info("MAIN", "Application Listening on Port " + PORT);
});
