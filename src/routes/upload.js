import fetch from "node-fetch";
import FormData from "form-data";
import { createReadStream } from "fs";

import dotenv from "dotenv";
dotenv.config();

export async function uploadFile(path) {
	try {
		let form = new FormData();

		form.append("file", createReadStream(path));

		let res = await fetch(process.env.FILESERVER_URL + "/files/upload", {
			method: "POST",
			headers: {
				Authorization: "SOFTWARE " + process.env.FILESERVER_TOKEN,
			},
			body: form,
		});
		let result = await res.json();

		if (result.ok) {
			return { ok: true, result: result };
		} else {
			return { ok: false, result: result };
		}
	} catch (err) {
		return { ok: false, error: err };
	}
}
