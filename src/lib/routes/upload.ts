import express from "express";
import FileType from "file-type";
import filenamifyUrl from "filenamify-url";
import fs from "fs-extra";
import { Schema } from "mongoose";
import multer from "multer";
import { customAlphabet, nanoid } from "nanoid";
import path from "path";
import randomColor from "randomcolor";
import {
	closestSizeRatio,
	convertToMp4,
	getImageSize,
	ImageMaxDimensions,
	resizeImage,
} from "../FileProcessor";
import { findTagId } from "../Helper";
import Gif from "../models/Gif";
import Media from "../models/Media";
import Tag from "../models/Tag";

const whitelistMime = ["image/png", "image/gif"];
const whitelistExt = ["png", "gif"];
const nanoNumbers = customAlphabet("1234567890", 8);

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
		const { path: imageProcessedPath }: { path: string } = req.file;
		const { tags = [] }: { tags: Array<string> } = req.body;
		const size = await getImageSize(imageProcessedPath);
		const tagIds: Array<Schema.Types.ObjectId | boolean> = [];
		for (const tag of tags) {
			const id = await findTagId(tag);
			if (id) tagIds.push(id);
			else {
				const newTag = await new Tag({
					text: tag,
					color: randomColor({ luminosity: "light" }),
				}).save();
				tagIds.push(newTag._id);
			}
		}

		const numberId = nanoNumbers();
		const slug =
			tags.length > 0
				? `${filenamifyUrl(tags.join("-"))}-gif-${numberId}`
				: `gif-${numberId}`;

		const gif = await new Gif({
			title: `${tags.slice(0, 2)} GIF`.trim(),
			slug,
			tags: tagIds,
		}).save();

		for (const [key, children] of Object.entries(ImageMaxDimensions)) {
			for (const [mediaType, mediaValue] of Object.entries(children)) {
				const uniqId = nanoid(32);
				const finalPath = path.join(
					process.cwd(),
					process.env.DIRECTORY_IMG,
					uniqId
				);

				await fs.ensureDir(finalPath);
				console.log(mediaType, finalPath);

				let ratio;
				if (mediaValue.hasOwnProperty("width")) {
					ratio = closestSizeRatio({
						maxWidth: mediaValue.width,
						...size,
					});
				} else if (mediaValue.hasOwnProperty("height")) {
					ratio = closestSizeRatio({
						maxHeight: mediaValue.height,
						...size,
					});
				} else {
					ratio = size;
				}

				const opts = {
					newWidth: ratio.width,
					newHeight: ratio.height,
					compress: mediaValue.compress ? mediaValue.compress : 0,
				};

				switch (key) {
					case "gif":
						await resizeImage({
							imagePath: imageProcessedPath,
							...opts,
							output: path.join(finalPath, "tenor.gif"),
						});
						break;
					case "mp4":
						await convertToMp4({
							imagePath: imageProcessedPath,
							...opts,
							output: path.join(finalPath, "tenor.mp4"),
						});
						break;
				}

				await new Media({
					gid: gif._id,
					path: uniqId,
					type: key,
					format: mediaType,
				}).save();
			}
		}

		fs.removeSync(imageProcessedPath);
		return res.status(200).json({ success: true, ...req.file });
	} catch (e) {
		console.error(e);
		return next();
	}
});

export { uploadRouter };
