import { Document, model, Schema } from "mongoose";
import slugify from "slugify";

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

TagSchema.pre("save", async function (next) {
	this.text = slugify(this.text, {
		lower: true,
		strict: true,
	});

	return next();
});

export default model<ITag>("Tag", TagSchema);
