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
		},
	],
});

export interface IGif extends Document {
	title: string;
	slug: string;
	tags: Array<ITag>;
}

GifSchema.statics.filterTag = function ({
	tags,
	limit = 7,
}: {
	tags: Array<string>;
	limit: number;
}) {
	return this.aggregate([
		{
			$lookup: {
				from: "tags",
				localField: "tags",
				foreignField: "_id",
				as: "tags",
			},
		},
		{
			$unwind: "$tags",
		},
		{ $match: { "tags.text": { $in: tags } } },
	])
		.limit(limit)
		.exec();
};

export default model<IGif>("Gif", GifSchema);
