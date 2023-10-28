# Music-Server

Simple Music player to stream Audio from Youtube Videos. Enter the Video-Id and let the Software download it for you. With the integradet player you can listen to the downloaded files.

## Setup

1. Clone the repo
2. Install dependencies

```bash
npm install
```

3. Declare environment vars. For that create a `.env` file in the root of the project containing the following:

```env
PORT=
DATABASE_NAME=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_PORT=
DATABASE_HOST=

FILESERVER_TOKEN=
FILESERVER_URL=
```

4. Run the app:

```bash
npm run dev
```

## Info

Requires you to have ffmpeg installed locally. [Download ffmpeg from here](https://ffmpeg.org/download.html).

Install on Linux (apt/snap):

```bash
sudo apt install ffmpeg
sudo snap install ffmpeg
```

## Docker dev
