import { Sequelize, Model, DataTypes } from "sequelize";

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
		console.log("DB:", message);
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
		uuid: {
			type: DataTypes.STRING,
		},
		name: {
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
		title: {
			type: DataTypes.STRING,
		},
		description: {
			type: DataTypes.TEXT,
		},
		thumbnail: {
			type: DataTypes.STRING,
		},
	},
	{
		sequelize: connection,
		tableName: "Playlists",
		timestamps: false,
	}
);

class PlaylistSong extends Model {}

PlaylistSong.init(
	{},
	{
		sequelize: connection,
		timestamps: false,
		tableName: "PlaylistSongs",
	}
);

Song.hasMany(Location);
Location.belongsTo(Song);

Playlist.belongsToMany(Song, { through: PlaylistSong });
Song.belongsToMany(Playlist, { through: PlaylistSong });

User.hasMany(Playlist);
Playlist.belongsTo(User);

User.hasMany(Song);
Song.belongsTo(User, { foreignKey: "UploadedBy" });

Artist.hasMany(Song);
Song.belongsTo(Artist);

connection.sync({ alter: true });
