import { Document, model, Schema } from "mongoose";
import { ITag } from "./Tag";

const GifSchema: Schema = new Schema({
	title: {
		type: String,
		text: true,
	},
	slug: {
		type: String,
		required: true,
		lowercase: true,
	},
	tags: [
		{
			type: Schema.Types.ObjectId,
			ref: "Tag",
			unique: true,
		},
	],
});

export interface IGif extends Document {
	title: string;
	slug: string;
	tags: Array<ITag>;
}

export default model<IGif>("Gif", GifSchema);
