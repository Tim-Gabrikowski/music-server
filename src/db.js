import { Sequelize, Model, DataTypes, Op } from "sequelize";
import * as logger from "./logger.js";

import dotenv from "dotenv";
dotenv.config();

const connection = new Sequelize(
	process.env.DATABASE_NAME,
	process.env.DATABASE_USERNAME,
	process.env.DATABASE_PASSWORD,
	{
		port: process.env.DATABASE_PORT,
		host: process.env.DATABASE_HOST,
		logging: dbLogger(),
		dialect: "mysql",
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
	}
);

function dbLogger() {
	return (message) => {
		logger.debug("DATABASE", message);
	};
}

export class Song extends Model {}

Song.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		key: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		seconds: {
			type: DataTypes.INTEGER,
		},
		thumbnail: {
			type: DataTypes.STRING,
		},
		url: {
			type: DataTypes.STRING,
		},
	},
	{
		sequelize: connection,
		modelName: "Songs",
		timestamps: false,
	}
);

export class Location extends Model {}

Location.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		type: {
			type: DataTypes.STRING,
		},
		path: {
			type: DataTypes.STRING,
		},
	},
	{
		tableName: "Locations",
		sequelize: connection,
		timestamps: false,
	}
);

export class Artist extends Model {}

Artist.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
		},
		key: {
			type: DataTypes.STRING,
		},
		user: {
			type: DataTypes.STRING,
		},
		url: {
			type: DataTypes.STRING,
		},
		thumbnail: {
			type: DataTypes.STRING,
		},
	},
	{
		sequelize: connection,
		tableName: "Artists",
		timestamps: false,
	}
);

export class User extends Model {}

User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		gid_uuid: {
			type: DataTypes.STRING,
		},
		name: {
			type: DataTypes.STRING,
		},
		username: {
			type: DataTypes.STRING,
		},
		thumbnail: {
			type: DataTypes.STRING,
		},
	},
	{
		sequelize: connection,
		tableName: "Users",
		timestamps: false,
	}
);

export class Playlist extends Model {}

Playlist.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		key: {
			type: DataTypes.STRING,
			unique: "playlist_key",
			allowNull: false,
			defaultValue: "",
		},
		title: {
			type: DataTypes.STRING,
			defaultValue: "",
		},
		description: {
			type: DataTypes.TEXT,
			defaultValue: "",
		},
		thumbnail: {
			type: DataTypes.STRING,
			defaultValue: "",
		},
	},
	{
		sequelize: connection,
		tableName: "Playlists",
		timestamps: false,
		hooks: {
			afterFind: async (records, options) => {
				if (records instanceof Array) {
					for (let i = 0; i < records.length; i++) {
						const list = records[i];
						let c = await list.countSongs();
						records[i].dataValues.songCount = c;
					}
				} else if (typeof records == null) {
					return;
				} else if (records instanceof Playlist) {
					let c = await records.countSongs();
					records.dataValues.songCount = c;
				}
			},
		},
	}
);

export class PlaylistSong extends Model {}

PlaylistSong.init(
	{
		time: {
			type: DataTypes.BIGINT,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		sequelize: connection,
		timestamps: false,
		tableName: "PlaylistSongs",
		hooks: {
			beforeValidate: (elem) => {
				elem.time = Date.now();
			},
		},
	}
);

export class Recommendation extends Model {}

Recommendation.init(
	{
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
		},
		recommendsKey: {
			type: Sequelize.STRING,
			allowNull: true,
		},
	},
	{
		sequelize: connection,
		timestamps: false,
		tableName: "Recommendations",
	}
);

Song.belongsToMany(Song, {
	through: Recommendation,
	as: "recommendedSongs",
	foreignKey: "songId", // This is the foreign key in the Recommendation table
	otherKey: "recommendedSongId", // This is the foreign key for the recommended song
});

// Optional: If you want a bidirectional association
Song.belongsToMany(Song, {
	through: Recommendation,
	as: "recommendingSongs",
	foreignKey: "recommendedSongId",
	otherKey: "songId",
});

Song.hasMany(Location, { onDelete: "cascade" });
Location.belongsTo(Song);

Playlist.belongsToMany(Song, { through: PlaylistSong });
Song.belongsToMany(Playlist, { through: PlaylistSong });

User.hasMany(Playlist);
Playlist.belongsTo(User);

Artist.hasMany(Song);
Song.belongsTo(Artist);

export async function initDB() {
	let ok = true;
	try {
		await connection.sync({ alter: true });
		// FIXME: Do necessary migration of database here

		// fileserver url from stream to fileserver location
		let songs = await Song.findAll({
			include: [
				{
					model: Location,
					where: {
						type: "stream",
						path: {
							[Op.like]: process.env.FILESERVER_URL + "%",
						},
					},
				},
			],
		});

		for (const song of songs) {
			// TODO: replace fileserver id with fileserver key once the fileserver is updated (migration)
			let loc = await Location.build({
				type: "fileserver",
				path: song.dataValues.Locations[0].dataValues.path,
				SongId: song.dataValues.id,
			}).save();
			await song.dataValues.Locations[0].update({
				path: process.env.HOST + "/stream/" + song.dataValues.key,
			});
			console.log(loc);
		}
	} catch (err) {
		return err;
	}
	return ok;
}

export async function songWithKeyExists(key) {
	let song = await Song.findOne({ where: { key: key } });

	return !(song == undefined || song == null);
}
export async function artistWithKeyExists(key) {
	let artist = await Artist.findOne({ where: { key: key } });

	return !(artist == undefined || artist == null);
}
