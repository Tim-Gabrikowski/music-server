import express from "express";
import cors from "cors";

const PORT = process.env.PORT || 3010;

const app = express();

app.use(cors());
app.use(express.json());

import songsRouter from "./routes/songs.js";
import artistsRouter from "./routes/artists.js";

app.use("/songs", songsRouter);
app.use("/artists", artistsRouter);

app.listen(PORT, function () {
	console.log("[NodeJS] Application Listening on Port " + PORT);
});
