import { Document, model, Model, Schema } from "mongoose";
import Tag, { ITagDocument } from "./Tag";

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

export interface IGifDocument extends Document {
	title: string;
	slug: string;
	tags: Array<ITagDocument>;
}

export interface IGifModel extends Model<IGifDocument> {
	filterTag({
		tags,
		limit,
		ignore,
	}: {
		tags: Array<string>;
		limit: number;
		ignore: Schema.Types.ObjectId;
	}): Promise<Array<IGifDocument>>;
}

GifSchema.statics.filterTag = function ({
	tags,
	limit = 7,
	ignore,
}: {
	tags: Array<string>;
	limit: number;
	ignore: Schema.Types.ObjectId;
}): Promise<Array<IGifDocument>> {
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
				$and: [{ _id: { $ne: ignore } }, { "tags.text": { $in: tags } }],
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

export default model<IGifDocument, IGifModel>("Gif", GifSchema);
