import { Document, model, Model, Schema } from "mongoose";
import { buildImgUrl } from "../Helper";
import { AggregationType } from "../types/Aggr";
import { MediaParentType } from "../types/MediaAPI";
import Media from "./Media";
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
	searchTag({
		tags,
		limit,
		ignore,
		mainTag,
		randomSize,
	}: {
		tags: Array<string>;
		limit: number;
		ignore?: any;
		mainTag?: string;
		randomSize?: number;
	}): Promise<Array<IGifDocument>>;

	getMedias({
		gifId,
	}: {
		gifId: Schema.Types.ObjectId;
	}): Promise<MediaParentType>;
}

GifSchema.statics.searchTag = async function ({
	tags,
	limit = 0,
	ignore = null,
	mainTag = "",
	randomSize = 0,
}: {
	mainTag: string;
	tags: Array<string>;
	limit: number;
	ignore: any;
	randomSize: number;
}): Promise<Array<IGifDocument>> {
	const aggr: Array<AggregationType> = [
		{
			$lookup: {
				from: Tag.collection.name,
				localField: "tags",
				foreignField: "_id",
				as: "tags",
			},
		},
	];

	if (ignore !== null)
		aggr.push({
			$match: {
				$and: [{ _id: { $ne: ignore } }, { "tags.text": { $in: tags } }],
			},
		});
	else
		aggr.push({
			$match: { "tags.text": { $in: tags } },
		});

	aggr.push({
		$group: {
			_id: "$_id",
			title: { $first: "$title" },
			slug: { $first: "$slug" },
			tags: { $first: "$tags" },
		},
	});

	if (mainTag.length > 0) {
		aggr.push({
			$addFields: {
				score: {
					$cond: [{ $in: [mainTag, "$tags.text"] }, 1, 0],
				},
			},
		});

		aggr.push({ $sort: { score: -1 } });
	}

	aggr.push({
		$project: {
			__v: 0,
			"tags._id": 0,
			"tags.__v": 0,
			score: 0,
		},
	});

	if (randomSize > 0) aggr.push({ $sample: { size: 10 } });
	const gifs = this.aggregate(aggr);
	if (limit > 0) gifs.limit(limit);
	return gifs.exec();
};

GifSchema.statics.getMedias = async function ({
	gifId,
}: {
	gifId: Schema.Types.ObjectId;
}): Promise<MediaParentType> {
	const arr: MediaParentType = {};
	const medias = await Media.find({ gid: gifId }).exec();
	for (const media of medias) {
		arr[media.format] = {
			dims: media.dimens,
			url: buildImgUrl(media.path, media.format),
			preview: buildImgUrl(media.path, "jpg"),
			size: media.size,
		};
	}

	return arr;
};

export default model<IGifDocument, IGifModel>("Gif", GifSchema);
