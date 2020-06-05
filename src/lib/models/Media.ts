import { Document, model, Schema } from "mongoose";

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
});

export interface IMedia extends Document {
	gid: Schema.Types.ObjectId;
	path: string;
	type: String;
}

export default model<IMedia>("Media", MediaSchema);
