import dayjs from "dayjs";
import { Document, model, Schema } from "mongoose";

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

export interface IView extends Document {
	term: string;
	count: number;
	date: Date;
}

ViewSchema.statics.setTermSearched = async function ({
	term,
}: {
	term: string;
}) {
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

export default model<IView>("View", ViewSchema);
