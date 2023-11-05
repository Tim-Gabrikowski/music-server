import { createVerify, publicDecrypt } from "crypto";
import { publicKey } from "./keypair.js";

export function decrypt(encryptedMessage) {
	return publicDecrypt(
		publicKey,
		Buffer.from(encryptedMessage, "hex")
	).toString("utf-8");
}

export function verify(decryptedMessage, signature) {
	let verifier = createVerify("rsa-sha256");
	verifier.update(decryptedMessage);
	return verifier.verify(publicKey, signature, "hex");
}
