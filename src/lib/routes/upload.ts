import express from "express";
import FileType from "file-type";
import fs from "fs-extra";
import { Schema } from "mongoose";
import multer from "multer";
import { customAlphabet, nanoid } from "nanoid";
import path from "path";
import randomColor from "randomcolor";
import slugify from "slugify";
import {
	closestSizeRatio,
	convertToMp4,
	generateScreenshot,
	getFileSize,
	getImageSize,
	getMediaDuration,
	ImageMaxDimensions,
	resizeImage,
} from "../FileProcessor";
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
		let { tags = [] }: { tags: Array<string> } = req.body;
		if (!Array.isArray(tags)) tags = [tags];
		const tagIds: Array<Schema.Types.ObjectId | boolean> = [];
		for (const tag of tags) {
			const id = await Tag.findTag(tag);
			if (!id) {
				const newTag = await new Tag({
					text: tag,
					color: randomColor({ luminosity: "dark" }),
				}).save();
				tagIds.push(newTag._id);
				continue;
			}

			tagIds.push(id);
		}

		const numberId = nanoNumbers();
		const slug =
			tags.length > 0
				? `${slugify(tags.join("-"))}-gif-${numberId}`
				: `gif-${numberId}`;

		const size = await getImageSize(imageProcessedPath);
		const duration = await getMediaDuration(imageProcessedPath);
		const gif = await new Gif({
			title: `${tags.slice(0, 2).join(" ")} GIF`.trim(),
			slug,
			tags: tagIds,
			details: {
				duration,
				dimens: [size.width, size.height],
			},
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

				let ratio: { height: number; width: number };
				if (mediaValue.hasOwnProperty("width"))
					ratio = closestSizeRatio({
						maxWidth: mediaValue.width,
						...size,
					});
				else if (mediaValue.hasOwnProperty("height"))
					ratio = closestSizeRatio({
						maxHeight: mediaValue.height,
						...size,
					});
				else ratio = size;

				const opts = {
					newWidth: ratio.width,
					newHeight: ratio.height,
					compress: mediaValue.compress ? mediaValue.compress : false,
				};

				let output: string = "";
				switch (key) {
					case "gif":
						output = path.join(finalPath, "tenor.gif");
						await resizeImage({
							imagePath: imageProcessedPath,
							...opts,
							output,
						});
						break;
					case "mp4":
						output = path.join(finalPath, "tenor.mp4");
						await convertToMp4({
							imagePath: imageProcessedPath,
							...opts,
							output,
						});
						break;
				}

				if (output.length > 0) {
					await generateScreenshot({
						path: output,
						output: path.join(finalPath, "tenor.jpg"),
					});

					await new Media({
						gid: gif._id,
						path: uniqId,
						type: key,
						format: mediaType,
						dimens: [ratio.width, ratio.height],
						size: getFileSize(output),
					}).save();
				}
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
