import { EventEmitter } from "events";
import mongoose from "mongoose";

export default class Database extends EventEmitter {
	constructor() {
		super();
		mongoose.connect(
			`mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${
				process.env.DEV ? process.env.MONGO_DEV_URL : process.env.MONGO_PROD_URL
			}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`,
			{
				useNewUrlParser: true,
				useUnifiedTopology: true,
				useCreateIndex: true,
			}
		);

		mongoose.connection.on("error", (error) => console.error(error));
		mongoose.connection.once("open", () => this.emit("connected"));
	}
}
