import express from "express";
import slugify from "slugify";
import Gif from "../models/Gif";
import Media from "../models/Media";
import Tag, { ITag } from "../models/Tag";
import View from "../models/View";

const apiRouter = express.Router();

apiRouter.get("/trending", async (req, res) => {
	const { page = 1, limit = 20 } = req.query;
	const pageLimit = Math.abs(Number(limit.toString())) || 20;
	const currentPage = (Math.abs(Number(page.toString())) || 1) - 1;
	const gifs = await Gif.find({})
		.populate("tags")
		.sort({ _id: -1 })
		.skip(pageLimit * currentPage)
		.limit(pageLimit)
		.exec();

	const p = {
		weburl: "trending",
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
				size: media.size,
			};
		}

		p.results.push(ig);
	}

	return res.status(200).json(p);
});

apiRouter.get("/search", async (req, res) => {
	const {
		key,
		q = "",
		media_filter = "default",
		limit = 10,
	} = (req.query as any) as {
		key: string;
		q: string;
		media_filter: string;
		limit: number;
	};

	if (q.length < 1) return res.status(400).json({ msg: "Missing query q key" });
	let maxLimit = Number(limit.toString());
	if (isNaN(maxLimit) || maxLimit < 0 || maxLimit > 99) maxLimit = 10;
	const searchTerm = decodeURIComponent(q.toString());
	const slugSearchTerm = slugify(searchTerm, {
		lower: true,
		strict: true,
	});

	await View.setTermSearched({ term: searchTerm });
	console.log([slugSearchTerm].concat(searchTerm.split(" ")));
	const gifs = await Gif.aggregate([
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
				"tags.text": {
					$in: [slugSearchTerm].concat(searchTerm.split(" ")),
				},
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
				_id: 1,
				title: 1,
				slug: 1,
				tags: 1,
				score: {
					$cond: [{ $in: [slugSearchTerm, "$tags.text"] }, 1, 0],
				},
			},
		},
		{ $sort: { score: -1 } },
	])
		.limit(maxLimit)
		.exec();
	// console.log(JSON.stringify(gifs, null, 2));
	require("fs").writeFileSync("./test.json", JSON.stringify(gifs, null, 2));
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
				size: media.size,
			};
		}

		p.results.push(ig);
	}

	return res.status(200).json(p);
});

apiRouter.get("/", async (req, res) => {
	const { slug = "", related = 0, full = 0 } = req.query;
	if (slug.length < 1) return res.status(404).json({ msg: "Not found" });
	const gif = await Gif.findOne({ slug: slug.toString() })
		.populate("tags")
		.exec();

	// if (gif === null)

	const p = {
		weburl: slug,
		results: [],
		related: [],
	};

	const tags =
		full === "1"
			? gif.tags.map((tag: ITag) => {
					return { text: tag.text, color: tag.color };
			  })
			: gif.tags.map((tag: ITag) => tag.text);

	const ig = {
		title: gif.title,
		itemurl: gif.slug,
		tags,
		media: {},
	};

	const medias = await Media.find({ gid: gif._id }).exec();
	for (const media of medias) {
		ig.media[media.format] = {
			dims: media.dimens,
			url: media.path,
			preview: "",
			size: media.size,
		};
	}

	p.results.push(ig);
	if (related === "1") {
		const relatedGifs = await Gif.filterTag({
			tags: gif.tags.map((tag: ITag) => tag.text),
			limit: 7,
			ignore: gif._id,
		});

		for (const gif of relatedGifs) {
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
					size: media.size,
				};
			}

			p.related.push(ig);
		}
	}
	return res.status(200).json(p);
});

export { apiRouter };
