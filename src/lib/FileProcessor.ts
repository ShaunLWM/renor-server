import fs from "fs-extra";
import imagemin from "imagemin";
import gifsicle from "imagemin-gifsicle";
import path from "path";

const compressGif = async (paths: Array<string>) => {
	const files = await imagemin(paths, {
		glob: false,
		destination: path.resolve(process.cwd(), process.env.DIRECTORY_IMG),
		plugins: [
			gifsicle({
				optimizationLevel: 3,
				lossy: 180,
			}),
		],
	});

	paths.map(fs.removeSync);
	return files;
};

export { compressGif };
