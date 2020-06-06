import express from "express";
import Gif from "../models/Gif";
import Media from "../models/Media";

const apiRouter = express.Router();

apiRouter.get("/search", async (req, res, next) => {
	const { key, q = "", media_filter = "default", limit = 10 } = req.query;
	if (q.length < 1) return res.status(400).json({ msg: "Missing query q key" });
	let maxLimit = parseInt(limit.toString(), 10);
	if (isNaN(maxLimit) || maxLimit < 0 || maxLimit > 99) maxLimit = 10;
	const gifs = await Gif.find({}) // $text: { $search: q.toString() }
		.populate({ path: "tags", match: { text: q.toString() } })
		.exec();
	console.log(gifs);
	return next();

	for (const gif of gifs) {
		const media = await Media.find({ gid: gif._id }).exec();
	}
});

export { apiRouter };
