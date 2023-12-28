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
HOST=

DATABASE_HOST=
DATABASE_PORT=
DATABASE_NAME=
DATABASE_USERNAME=
DATABASE_PASSWORD=

FILESERVER_TOKEN=
FILESERVER_URL=

DYNAMIC_IMPORT_CRON=
```

|          Var          | description                                                                                                                                       |               example               |
| :-------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------: |
|        `PORT`         | Port the Application should listen on                                                                                                             |               `3010`                |
|        `HOST`         | The full hostname the server is reachable with. (With http and all routes). Is beeing used to write the streamUrl to the. (MIGRATION TOOL NEEDED) | `http://localhost:3010/musicserver` |
|    `DATABASE_HOST`    | Hostname of the Database                                                                                                                          |             `localhost`             |
|    `DATABASE_PORT`    | Port of the Database                                                                                                                              |               `3306`                |
|    `DATABASE_NAME`    | Name of the Database on the Database server                                                                                                       |            `musicserver`            |
|  `DATABASE_USERNAME`  | Username of the MySQL User that has access to the database                                                                                        |            `musicserver`            |
|  `DATABASE_PASSWORD`  | Password of the MySQL User that has access to the database                                                                                        |          `Mus!cServer123`           |
|   `FLIESERVER_URL`    | Full Url to the [Fileserver](https://github.com/Tim-Gabrikowski/file-store)                                                                       | `http://localhost:3030/fileserver`  |
|  `FILESERVER_TOKEN`   | Access Token to the fileServer                                                                                                                    |   `MusicServerTokenPlsDontShare`    |
| `DYNAMIC_IMPORT_CRON` | Cron Entry for the Interval how often the Server should automatically import or reload data from youtube (e.g. Recommendations)                   |   `*/5 * * * *` (every 5 minutes)   |

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
