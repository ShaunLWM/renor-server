import { Document, model, Schema } from "mongoose";

const TagSchema: Schema = new Schema({
	text: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		index: true,
		text: true,
	},
	color: {
		type: String,
		required: true,
		lowercase: true,
	},
});

export interface ITag extends Document {
	text: string;
	color: string;
}

export default model<ITag>("Tag", TagSchema);
