import { decrypt, verify } from "../tools/decryption.js";

export async function authMiddleware(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (token == null) {
		return res.status(401).send({ token: false, valid: false });
	}
	let tokenType = authHeader.split(" ")[0];

	let result = {};
	switch (tokenType) {
		case "GID":
			result = validateGID(token);
			break;
		default:
			result = { valid: false };
			break;
	}
	if (result.valid && result.user) {
		req.user = result.user;
		req.user.tokenType = tokenType;
		next();
	} else {
		res.status(401).send({ token: true, valid: false });
	}
}

function validateGID(token) {
	let userStrEnc = token.split("_")[0];
	let signature = token.split("_")[1];

	let userStr = "";
	let verified = false;

	try {
		userStr = decrypt(userStrEnc);
		verified = verify(userStr, signature);
	} catch {}

	let userdata = {};
	try {
		userdata = JSON.parse(userStr);
	} catch (err) {}

	return {
		valid: verified,
		user: userdata || null,
	};
}
