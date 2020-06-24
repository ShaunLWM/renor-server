import execa from "execa";
(async () => {
	try {
		// const { stdout, stderr } = await execa("ffprobe", [
		// 	"-v",
		// 	"error",
		// 	"-show_entries",
		// 	"format=duration",
		// 	"-of",
		// 	"default=noprint_wrappers=1:nokey=1",
		// 	"D:/Projects/genor-server/process/HzvlsM.gif",
		// ]);

		const { stdout, stderr } = await execa("ffmpeg", [
			"-i",
			"D:/Projects/genor-server/process/HzvlsM.gif",
			"-f",
			"null",
			"-",
		]);

		console.log(stderr);
	} catch (error) {
		console.error(error);
		return false;
	}
})();
