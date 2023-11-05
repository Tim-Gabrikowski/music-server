import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_PATH = path.join(__dirname, "..", "..", "keys");
const PUBLIC_KEY_PATH = path.join(KEY_PATH, "public.key");

if (!fs.existsSync(KEY_PATH)) {
	fs.mkdirSync(KEY_PATH);
}
export const publicKey = fs.readFileSync(PUBLIC_KEY_PATH);
