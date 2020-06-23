import { Document, model, Model, Schema } from "mongoose";
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

export interface ITagDocument extends Document {
	text: string;
	color: string;
}

TagSchema.pre<ITagDocument>("save", async function (next) {
	this.text = slugify(this.text, {
		lower: true,
		strict: true,
	});

	return next();
});

TagSchema.statics.findTag = async function (
	tag: string
): Promise<boolean | Schema.Types.ObjectId> {
	const res = await this.findOne({
		text: slugify(tag, {
			lower: true,
			strict: true,
		}),
	}).exec();
	if (res === null) return false;
	return res._id;
};

export interface ITagModel extends Model<ITagDocument> {
	findTag(tag: string): Promise<boolean | Schema.Types.ObjectId>;
}

export default model<ITagDocument, ITagModel>("Tag", TagSchema);
