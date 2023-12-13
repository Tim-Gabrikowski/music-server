import { decrypt, verify } from "../tools/decryption.js";
import { User } from "../db.js";

export async function authMiddleware(req, res, next) {
	const authHeader = req.headers["authorization"];
	let token = authHeader && authHeader.split(" ")[1];

	let tokenType;
	if (token == null) {
		token = req.query.t;
		tokenType = "GID";
	} else {
		tokenType = authHeader.split(" ")[0];
	}

	if (token == null) {
		return res.status(401).send({ token: false, valid: false });
	}

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
		let user = await User.findOne({
			where: { gid_uuid: result.user.uuid },
		});
		if (user == null)
			user = await registerNewGIDUser(
				result.user.uuid,
				result.user.name,
				result.user.username
			);
		req.user = user.dataValues;
		console.log(req.user);
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

function registerNewGIDUser(uuid, name, username) {
	return User.build({ name: name, gid_uuid: uuid, username }).save();
}
