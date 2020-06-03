import execa from "execa";

const checkFfmpegExist = async (): Promise<boolean> => {
	try {
		const { stdout } = await execa("ffmpeg", ["-version"]);
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
};
export { checkFfmpegExist };
