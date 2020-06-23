import execa from "execa";
import { Schema } from "mongoose";
import Tag from "./models/Tag";

const checkFfmpegExist = async (): Promise<boolean> => {
	try {
		const { stdout } = await execa("ffmpeg", ["-version"]);
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
};

const findTagId = async (
	tag: string
): Promise<Schema.Types.ObjectId | boolean> => {
	const res = await Tag.findOne({ text: tag.toLowerCase() }).exec();
	if (res === null) return false;
	return res._id;
};

const getExtFromKey = (key: string): string => {
	switch (key) {
		case "gif":
		case "mediumgif":
		case "tinygif":
		case "nanogif":
			return "gif";
		case "mp4":
		case "loopedmp4":
		case "tinymp4":
		case "nanomp4":
			return "mp4";
		case "webm":
		case "tinywebm":
		case "nanowebm":
			return "webm";
	}
};

const buildImgUrl = (path: string, format: string): string => {
	return `${process.env.BASE_URL}:${
		process.env.SERVER_PORT
	}/img/${path}/tenor.${getExtFromKey(format)}`;
};

export { checkFfmpegExist, findTagId, getExtFromKey, buildImgUrl };
