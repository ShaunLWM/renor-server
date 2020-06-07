import express from "express";
import Gif from "../models/Gif";
import Media from "../models/Media";
import Tag, { ITag } from "../models/Tag";

const apiRouter = express.Router();

apiRouter.get("/search", async (req, res, next) => {
	const { key, q = "", media_filter = "default", limit = 10 } = req.query;
	if (q.length < 1) return res.status(400).json({ msg: "Missing query q key" });
	let maxLimit = parseInt(limit.toString(), 10);
	if (isNaN(maxLimit) || maxLimit < 0 || maxLimit > 99) maxLimit = 10;
	const gifs = await Gif.aggregate([
		{
			$lookup: {
				from: Tag.collection.name,
				localField: "tags",
				foreignField: "_id",
				as: "tags",
			},
		},
		{ $match: { "tags.text": { $in: [q.toString()] } } },
		{
			$group: {
				_id: "$_id",
				title: { $first: "$title" },
				slug: { $first: "$slug" },
				tags: { $first: "$tags" },
			},
		},
	]).exec();

	const p = {
		weburl: encodeURIComponent(q.toString()),
		results: [],
	};

	for (const gif of gifs) {
		const ig = {
			title: gif.title,
			itemurl: gif.slug,
			tags: gif.tags.map((tag: ITag) => tag.text),
			media: {},
		};

		const medias = await Media.find({ gid: gif._id }).exec();
		for (const media of medias) {
			ig.media[media.format] = {
				dims: media.dimens,
				url: media.path,
				preview: "",
				size: 0,
			};
		}

		p.results.push(ig);
	}

	return res.status(200).json(p);
});

export { apiRouter };
