import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import fs from "fs-extra";
import helmet from "helmet";
import path from "path";
import Database from "./lib/Database";
import { checkFfmpegExist } from "./lib/Helper";
import { apiRouter, uploadRouter } from "./lib/routes";

config();

const app = express();
const db = new Database();

app.use(cors());
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use("/upload", uploadRouter);
app.use(`/${process.env.API_VERSION}`, apiRouter);

app.use(
	(err: any, req: express.Request, res: express.Response, next: Function) => {
		console.error(err.stack);
		return res.status(500).send("Something broke!");
	}
);

const SERVER_PORT = process.env.BASE_URL.split(":")[2];
db.on("connected", () => {
	console.log("[+] mongodb connected");
	app.listen(SERVER_PORT, async () => {
		//await fs.remove(path.resolve(process.cwd(), process.env.DIRECTORY_IMG));
		await fs.ensureDir(path.resolve(process.cwd(), process.env.DIRECTORY_IMG));
		//await fs.remove(path.resolve(process.cwd(), process.env.DIRECTORY_PROCESS_IMG));
		await fs.ensureDir(
			path.resolve(process.cwd(), process.env.DIRECTORY_PROCESS_IMG)
		);

		const embedData = await fs.readFile(
			path.resolve(process.cwd(), "src", "lib", "data", "embed.txt"),
			"utf8"
		);
		const replacedEmbedData = embedData.replace(
			"{SERVER_URL}",
			process.env.BASE_URL
		);

		await fs.writeFile(
			path.resolve(process.cwd(), "public", "embed.js"),
			replacedEmbedData
		);

		const ffmpeg = await checkFfmpegExist();
		if (!ffmpeg) throw new Error("FFMPEG doesnt exist");
		console.log(`[+] server listening on port ${SERVER_PORT}`);
	});
});
