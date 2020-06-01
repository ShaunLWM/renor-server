import cors from "cors";
import { config } from "dotenv";
import express from "express";
import fs from "fs-extra";
import helmet from "helmet";
import path from "path";
import { uploadRouter } from "./lib/routes";

config();

const app = express();
app.use(cors());
app.use(helmet());
app.use("/upload", uploadRouter);

app.use(
	(err: any, req: express.Request, res: express.Response, next: Function) => {
		console.error(err.stack);
		return res.status(500).send("Something broke!");
	}
);
app.listen(process.env.SERVER_PORT, async () => {
	//await fs.remove(path.resolve(process.cwd(), process.env.DIRECTORY_IMG));
	await fs.ensureDir(path.resolve(process.cwd(), process.env.DIRECTORY_IMG));
	//await fs.remove(path.resolve(process.cwd(), process.env.DIRECTORY_PROCESS_IMG));
	await fs.ensureDir(
		path.resolve(process.cwd(), process.env.DIRECTORY_PROCESS_IMG)
	);
	console.log(`[+] server listening on port ${process.env.SERVER_PORT}`);
});
