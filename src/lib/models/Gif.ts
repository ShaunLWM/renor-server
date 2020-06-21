import { Document, model, Schema } from "mongoose";
import Tag, { ITag } from "./Tag";

const GifSchema: Schema = new Schema({
	title: {
		type: String,
		required: true,
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
				from: Tag.collection.name,
				localField: "tags",
				foreignField: "_id",
				as: "tags",
			},
		},
		{
			$match: {
				"tags.text": { $in: tags },
			},
		},
		{
			$group: {
				_id: "$_id",
				title: { $first: "$title" },
				slug: { $first: "$slug" },
				tags: { $first: "$tags" },
			},
		},
		{
			$project: {
				__v: false,
				"tags._id": false,
				"tags.__v": false,
			},
		},
		{
			$sample: { size: 10 },
		},
	])
		.limit(limit)
		.exec();
};

export default model<IGif>("Gif", GifSchema);
