import dayjs from "dayjs";
import { Document, model, Model, Schema } from "mongoose";
import slugify from "slugify";

const ViewSchema: Schema = new Schema({
	term: {
		type: String,
		required: true,
		lowercase: true,
		index: true,
		text: true,
	},
	count: {
		type: Number,
		required: true,
		default: 1,
	},
	date: {
		type: Date,
		default: dayjs().startOf("day").toDate(),
	},
});

export interface IViewDocument extends Document {
	term: string;
	count: number;
	date: Date;
}

export interface IViewModel extends Model<IViewDocument> {
	setTermSearched({ term }: { term: string }): Promise<void>;
}

ViewSchema.pre<IViewDocument>("save", async function (next) {
	this.term = slugify(this.term, {
		lower: true,
		strict: true,
	});

	return next();
});

ViewSchema.statics.setTermSearched = async function ({
	term,
}: {
	term: string;
}): Promise<void> {
	const currentDate = dayjs();
	await this.findOneAndUpdate(
		{
			term,
			date: {
				$gte: currentDate.startOf("day").toDate(),
				$lte: currentDate
					.add(1, "day")
					.startOf("day")
					.subtract(1, "second")
					.toDate(),
			},
		},
		{ $inc: { count: 1 } },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	).exec();
};

export default model<IViewDocument, IViewModel>("View", ViewSchema);
