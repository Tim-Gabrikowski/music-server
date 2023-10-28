import shell from "shelljs";

const tagArg = process.argv[2]; // Get the tag argument

if (!tagArg) {
	console.error("Please provide a tag argument.");
	process.exit(1);
}

const imageName = "registry.gitlab.com/timgabhh/docker/music-server";

shell.exec(`docker build -t ${imageName}:${tagArg} .`);
