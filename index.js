const pureList =
	"https://youtube.com/playlist?list=PL-tu0Zgcb1SJ2RDA-mxFpV_7I7uYRysli";
const mixed =
	"https://www.youtube.com/watch?v=ZQKdayVotaI&list=PL-tu0Zgcb1SJ2RDA-mxFpV_7I7uYRysli&index=1";
const pureVid = "https://www.youtube.com/watch?v=ZQKdayVotaI";
const smalVid = "https://youtu.be/0KROgbD0kfQ";
const videoId = "ZQKdayVotaI";
const playlistId = "PL-tu0Zgcb1SJ2RDA-mxFpV_7I7uYRysli";

function getInputType(link) {
	let out = "";
	if (/^.{11}$/.test(link)) {
		out = "video id";
	} else if (/^.{34}$/.test(link)) {
		out = "playlist id";
	} else if (
		/(http|https):\/\/(www\.|)youtube\.com\/playlist\?list=.{34}/.test(link)
	) {
		out = "playlist link";
	} else if (
		/(http|https):\/\/(www\.|)youtube\.com\/watch\?v=.{11}&list=.{34}&.*/.test(
			link
		)
	) {
		out = "mixed link";
	} else if (
		/(http|https):\/\/(www\.|)youtube\.com\/watch\?v=.{11}$/.test(link)
	) {
		out = "video link";
	} else if (/(http|https):\/\/youtu\.be\/.{11}$/.test(link)) {
		out = "short video link";
	} else {
		out = "unknown";
	}
	return out;
}

console.log(getInputType(pureList));
console.log(getInputType(mixed));
console.log(getInputType(pureVid));
console.log(getInputType(playlistId));
console.log(getInputType(videoId));
console.log(getInputType(smalVid));
