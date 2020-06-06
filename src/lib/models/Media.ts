import { Document, model, Schema } from "mongoose";
import { MediaFilter } from "../FileProcessor";

const MediaSchema: Schema = new Schema({
	gid: {
		type: Schema.Types.ObjectId,
		ref: "Gif",
	},
	path: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		required: true,
		enum: ["gif", "mp4", "webm"],
	},
	format: {
		type: String,
		required: true,
		enum: [
			"gif",
			"mediumgif",
			"tinygif",
			"nanogif",
			"mp4",
			"loopedmp4",
			"tinymp4",
			"nanomp4",
			"webm",
			"tinywebm",
			"nanowebm",
		],
	},
	dimens: [{ type: Number, required: true }],
	filter: [{ type: MediaFilter, required: true }],
});

export interface IMedia extends Document {
	gid: Schema.Types.ObjectId;
	path: string;
	type: String;
	format: string;
	dimens: Array<number>;
	filter: Array<MediaFilter>;
}

export default model<IMedia>("Media", MediaSchema);
