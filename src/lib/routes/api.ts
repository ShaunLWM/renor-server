import express from "express";
import slugify from "slugify";
import Gif from "../models/Gif";
import { ITagDocument } from "../models/Tag";
import View from "../models/View";
import {
	APIResultRelated,
	APIResultType,
	GifResultType,
} from "../types/MediaAPI";

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

	const p: APIResultType = {
		weburl: "trending",
		results: [],
	};

	for (const gif of gifs) {
		const medias = await Gif.getMedias({ gifId: gif._id });
		const ig: GifResultType = {
			title: gif.title,
			itemurl: gif.slug,
			tags: gif.tags.map((tag: ITagDocument) => tag.text),
			media: [medias],
		};

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
	const gifs = await Gif.searchTag({
		mainTag: slugSearchTerm,
		tags: [slugSearchTerm].concat(searchTerm.split(" ")),
		limit: 7,
	});

	const p: APIResultType = {
		weburl: encodeURIComponent(q.toString()),
		results: [],
	};

	for (const gif of gifs) {
		const medias = await Gif.getMedias({ gifId: gif._id });
		const ig = {
			title: gif.title,
			itemurl: gif.slug,
			tags: gif.tags.map((tag: ITagDocument) => tag.text),
			media: [medias],
		};

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

	const p: APIResultRelated = {
		weburl: slug.toString(),
		results: [],
		related: [],
	};

	const tags =
		full === "1"
			? gif.tags.map((tag: ITagDocument) => {
					return { text: tag.text, color: tag.color };
			  })
			: gif.tags.map((tag: ITagDocument) => tag.text);

	const medias = await Gif.getMedias({ gifId: gif._id });
	const ig: GifResultType = {
		title: gif.title,
		itemurl: gif.slug,
		tags,
		media: [medias],
	};

	p.results.push(ig);
	if (related === "1") {
		const relatedGifs = await Gif.searchTag({
			tags: gif.tags.map((tag: ITagDocument) => tag.text),
			limit: 7,
			ignore: gif._id,
			randomSize: 10,
		});

		for (const gif of relatedGifs) {
			const medias = await Gif.getMedias({ gifId: gif._id });
			const ig: GifResultType = {
				title: gif.title,
				itemurl: gif.slug,
				tags: gif.tags.map((tag: ITagDocument) => tag.text),
				media: [medias],
			};

			p.related.push(ig);
		}
	}
	return res.status(200).json(p);
});

export { apiRouter };
