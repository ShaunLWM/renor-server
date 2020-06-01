import express from "express";
import FileType from "file-type";
import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import { compressGif } from "../FileProcessor";

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
	if (!req.file) return next();
	const { filename } = req.file;
	try {
		await compressGif([path.resolve(process.cwd(), req.file.path)]);
		return res.status(200).json({ success: true, ...req.file });
	} catch (e) {
		return next();
	}
});

export { uploadRouter };
