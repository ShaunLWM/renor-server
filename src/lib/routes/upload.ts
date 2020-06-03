import express from "express";
import FileType from "file-type";
import fs from "fs-extra";
import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import {
	closestSizeRatio,
	getImageSize,
	ImageMaxDimensions,
	resizeImage,
} from "../FileProcessor";

const whitelistMime = ["image/png", "image/gif"];
const whitelistExt = ["png", "gif"];

const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			return cb(
				null,
				path.join(process.cwd(), process.env.DIRECTORY_PROCESS_IMG)
			);
		},
		filename: (req, file, cb) => {
			const split = file.originalname.split(".");
			return cb(null, `${nanoid(6)}.${split[1].toLowerCase()}`);
		},
	}),
	limits: {
		fileSize: 10485760, // 10mb
	},
	fileFilter: async (req, file, cb) => {
		const split = file.originalname.split(".");
		if (split.length < 2) return cb(new Error("Missing extension"));
		if (
			!whitelistMime.includes(file.mimetype) ||
			!whitelistExt.includes(split[1].toLowerCase())
		)
			return cb(new Error("Wrong file type"));
		return cb(null, true);

		const fileInfo = await FileType.fromBuffer(file.buffer);
		if (
			!whitelistExt.includes(fileInfo.ext) ||
			!whitelistMime.includes(fileInfo.mime)
		)
			return cb(null, false);
		return cb(null, true);
	},
});

const uploadRouter = express.Router();

uploadRouter.post("/", upload.single("img"), async (req, res, next) => {
	try {
		if (!req.file) return next();
		const { path: imageProcessedPath } = req.file;
		const size = await getImageSize(imageProcessedPath);
		console.log(req.file);
		console.log(size);

		for (const [key, value] of Object.entries(ImageMaxDimensions)) {
			const uniqId = nanoid(32);
			const finalPath = path.join(
				process.cwd(),
				process.env.DIRECTORY_IMG,
				uniqId
			);

			await fs.ensureDir(finalPath);
			console.log(key, finalPath);
			if (value.format !== "gif") continue; // temp
			let ratio;
			if (value.hasOwnProperty("width")) {
				ratio = closestSizeRatio({
					maxWidth: value.width,
					...size,
				});
			} else if (value.hasOwnProperty("height")) {
				ratio = closestSizeRatio({
					maxHeight: value.height,
					...size,
				});
			} else {
				ratio = size;
			}

			const opts = {
				newWidth: ratio.width,
				newHeight: ratio.height,
				compress: value.compress ? value.compress : 0,
			};

			await resizeImage({
				imagePath: imageProcessedPath,
				...opts,
				output: path.join(finalPath, "tenor.gif"),
			});
		}

		fs.removeSync(imageProcessedPath);
		return res.status(200).json({ success: true, ...req.file });
	} catch (e) {
		console.error(e);
		return next();
	}
});

export { uploadRouter };
