import { config } from "dotenv";
import Database from "../lib/Database";
import Gif from "../lib/models/Gif";
import Tag from "../lib/models/Tag";

config();
const db = new Database();
db.on("connected", async () => {
	console.log("Connected");

	const { _id } = await Tag.findOne({ text: "LOL" }).exec();
	console.log(_id);
	process.exit(0);
	const tag = await new Tag({
		text: "dumb",
		color: "blank",
	}).save();
	console.log(tag);
	// 5ed89288fa64fc30b8bb3520 - laugh
	// 5ed892b6c527581a48933a1f - hehe

	// const gif = await new Gif({
	// 	title: "Famous laughing",
	// 	slug: "famous-laughing",
	// 	tags: [
	// 		"5ed89288fa64fc30b8bb3520",
	// 		"5ed892b6c527581a48933a1f",
	// 		"doesnt exist",
	// 	],
	// }).save();

	// console.log(gif);

	console.log(
		JSON.stringify(
			await Gif.find({ slug: "famous-laughing" })
				//.populate({ path: "tags", model: Tag })
				.populate("tags")
				.exec(),
			null,
			2
		)
	);
});
