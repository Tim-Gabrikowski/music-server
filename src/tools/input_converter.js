import ytdl from "ytdl-core";
import ytpl from "ytpl";

export const inputTypes = {
	VIDEO_ID: "video id",
	PLAYLIST_ID: "playlist id",
	VIDEO_LINK: "video link",
	PLAYLIST_LINK: "playlist link",
	MIXED_LINK: "mixed link",
	SHORT_LINK: "short link",
};

export function getInputType(link) {
	let out = "";

	if (/^.{11}$/.test(link)) {
		out = inputTypes.VIDEO_ID;

		// playlist id
	} else if (/^.{34}$/.test(link)) {
		out = inputTypes.PLAYLIST_ID;

		// playlist link
	} else if (
		/(http|https):\/\/(www\.|)youtube\.com\/playlist\?list=.{34}/.test(link)
	) {
		out = inputTypes.PLAYLIST_LINK;

		// mixed link
	} else if (
		/(http|https):\/\/(www\.|)youtube\.com\/watch\?v=.{11}&list=.{34}&.*/.test(
			link
		)
	) {
		out = inputTypes.MIXED_LINK;

		// video link
	} else if (
		/(http|https):\/\/(www\.|)youtube\.com\/watch\?v=.{11}$/.test(link)
	) {
		out = inputTypes.VIDEO_LINK;

		// short video link
	} else if (/(http|https):\/\/youtu\.be\/.{11}$/.test(link)) {
		out = inputTypes.SHORT_LINK;

		// unknown
	} else {
		out = "unknown";
	}
	return out;
}
export async function getInputData(input, type) {
	let data = {};
	let video_data = {};

	let songKeys = [];
	let songs = [];
	switch (type) {
		case inputTypes.VIDEO_ID:
			songKeys.push(input);
			songs.push(await createSongData(input));
			break;

		case inputTypes.PLAYLIST_ID:
			let pid_data = await ytpl(input);
			let pid_keys = pid_data.items.map((i) => i.id);
			songs.push(...pid_data.items.map(playlistItemToDataItem));
			songKeys.push(...pid_keys);
			break;

		case inputTypes.PLAYLIST_LINK:
			let pid_s = input.replace(
				/^(http|https):\/\/(www\.|)youtube\.com\/playlist\?list=/,
				""
			);
			let pd = await ytpl(pid_s);
			let pd_keys = pd.items.map((i) => i.id);
			songs.push(...pd.items.map(playlistItemToDataItem));
			songKeys.push(...pd_keys);
			break;

		case inputTypes.MIXED_LINK:
			let lastChunk = input.replace(
				/^(http|https):\/\/(www\.|)youtube\.com\/watch\?v=/,
				""
			);
			let vid_m = lastChunk.replace(/&list=.{34}&.*$/, "");
			let pid_m = lastChunk
				.replace(/^(.{11}&list=)/, "")
				.replace(/(&.*)$/, "");
			let pid_m_data = await ytpl(pid_m);
			let pid_m_keys = pid_m_data.items.map((i) => i.id);
			songs.push(...pid_m_data.items.map(playlistItemToDataItem));
			songKeys.push(...pid_m_keys);
			break;

		case inputTypes.VIDEO_LINK:
			let vid_s = input.replace(
				/^(http|https):\/\/(www\.|)youtube\.com\/watch\?v=/,
				""
			);
			video_data = await createSongData(vid_s);
			songs.push(video_data);
			songKeys.push(vid_s);
			break;

		case inputTypes.SHORT_LINK:
			let vid_sl = input.replace(/^(http|https):\/\/youtu\.be\//, "");
			songKeys.push(vid_sl);
			songs.push(await createSongData(vid_sl));
			break;

		default:
			data = {};
			break;
	}
	return { keys: songKeys, songs: songs };
}

function playlistItemToDataItem(item) {
	return {
		title: item.title,
		key: item.id,
		seconds: item.durationSec,
		url: item.shortUrl,
		thumbnail: item.bestThumbnail.url,
		artist: {
			key: item.author.channelID,
			name: item.author.name,
			user: item.author.url.split("/")[
				item.author.url.split("/").length - 1
			],
			url: item.author.url,
		},
	};
}
export async function createSongData(ytKey) {
	let data = await ytdl.getBasicInfo(ytKey);

	let sData = {
		title: data.videoDetails.title,
		key: ytKey,
		seconds: data.videoDetails.lengthSeconds,
		url: data.videoDetails.video_url,
		embedUrl: data.videoDetails.embed.iframeUrl,
		thumbnail: getThumbnail(data.videoDetails.thumbnails).url,
		artist: {
			key: data.videoDetails.author.id,
			name: data.videoDetails.author.name,
			user: data.videoDetails.author.user,
			url: data.videoDetails.author.channel_url,
			thumbnail: getThumbnail(data.videoDetails.author.thumbnails).url,
		},
		recommendedSongs: data.related_videos,
	};

	return sData;
}
function getThumbnail(thumbnails) {
	let highest = 0;
	let best = {};
	for (let i = 0; i < thumbnails.length; i++) {
		const thumb = thumbnails[i];
		if (thumb.width > highest) {
			best = thumb;
			highest = thumb.width;
		}
	}
	return best;
}
