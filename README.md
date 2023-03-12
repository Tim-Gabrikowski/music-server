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
HOST=[Hostname/ip/domain] # add the port if necessary. else port 80 will be used
PORT=[Port to listen to]
```

4. Run the app:

```bash
npm run start
```
