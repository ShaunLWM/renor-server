import execa from "execa";
import fs from "fs-extra";
import gifResize from "imagemin-gifsicle";
import { promisify } from "util";

const sizeOf = promisify(require("image-size"));

enum MediaFilter {
	DEFAULT = "default",
	BASIC = "basic",
	MINIMAL = "minimal",
}

interface IMDGrandChild {
	compress?: boolean;
	width?: number;
	height?: number;
	multiply?: number;
	filter: Array<MediaFilter>;
}

interface IMDParent<T> {
	[key: string]: T;
}

// https://tenor.com/gifapi/documentation#responseobjects-gifformat
const ImageMaxDimensions: IMDParent<IMDParent<IMDGrandChild>> = {
	gif: {
		gif: {
			filter: [MediaFilter.DEFAULT, MediaFilter.BASIC, MediaFilter.MINIMAL],
		},
		mediumgif: {
			compress: true,
			filter: [MediaFilter.DEFAULT],
		},
		tinygif: {
			width: 220,
			compress: true,
			filter: [MediaFilter.DEFAULT, MediaFilter.BASIC, MediaFilter.MINIMAL],
		},
		nanogif: {
			height: 90,
			compress: true,
			filter: [MediaFilter.DEFAULT, MediaFilter.BASIC],
		},
	},
	mp4: {
		mp4: {
			filter: [MediaFilter.DEFAULT, MediaFilter.BASIC, MediaFilter.MINIMAL],
		},
		loopedmp4: {
			multiply: 3,
			filter: [MediaFilter.DEFAULT],
		},
		tinymp4: {
			height: 320,
			width: 320,
			filter: [MediaFilter.DEFAULT, MediaFilter.BASIC],
		},
		nanomp4: {
			height: 150,
			width: 150,
			filter: [MediaFilter.DEFAULT, MediaFilter.BASIC],
		},
	},
	webm: {
		webm: {
			filter: [MediaFilter.DEFAULT],
		},
		tinywebm: {
			height: 320,
			width: 320,
			filter: [MediaFilter.DEFAULT],
		},
		nanowebm: {
			height: 150,
			width: 150,
			filter: [MediaFilter.DEFAULT],
		},
	},
};

const getImageSize = async (
	path: string
): Promise<{
	height: number;
	width: number;
	type: string;
	orientation: ImageOrientation;
}> => {
	const size = await sizeOf(path);
	return {
		...size,
		orientation: getImageOrientation(size),
	};
};

enum ImageOrientation {
	PORTRAIT,
	LANDSCAPE,
}

const getImageOrientation = ({
	height,
	width,
}: {
	height: number;
	width: number;
}) => {
	return height > width
		? ImageOrientation.PORTRAIT
		: ImageOrientation.LANDSCAPE;
};

const closestSizeRatio = ({
	height,
	width,
	maxHeight = 0,
	maxWidth = 0,
}: {
	height: number;
	width: number;
	maxHeight?: number;
	maxWidth?: number;
}): { height: number; width: number } => {
	if (maxHeight === 0 && maxWidth === 0)
		throw new Error("Ratio max must be set");

	if (maxHeight !== 0 && maxWidth !== 0)
		// shouldn't be the case
		return { height: maxHeight, width: maxWidth };

	if (maxHeight !== 0) {
		if (maxHeight > height) return { width, height };
		let tempWidth = Math.round(((width * 1.0) / height) * maxHeight);
		if (tempWidth % 2 === 1) tempWidth += 1;
		return {
			width: tempWidth,
			height: maxHeight,
		};
	}

	if (maxWidth !== 0) {
		if (maxWidth > width) return { width, height };
		let tempHeight = Math.round(((height * 1.0) / width) * maxWidth);
		if (tempHeight % 2 === 1) tempHeight += 1;
		return {
			width: maxWidth,
			height: tempHeight,
		};
	}

	throw new Error("Error getting ratio. Check parameters");
};

const resizeImage = async ({
	imagePath,
	newWidth = 0,
	newHeight = 0,
	compress = false,
	output,
}: {
	imagePath: string;
	newWidth?: number;
	newHeight?: number;
	output: string;
	compress: boolean;
}): Promise<void> => {
	const buf = fs.readFileSync(imagePath);
	let opts: {
		height?: number;
		width?: number;
		optimizationLevel?: number;
		lossy?: number;
	};
	if (newWidth === 0 && newHeight === 0)
		throw new Error("Width or height must be set");
	if (newWidth !== 0 && newHeight !== 0)
		opts = { height: newHeight, width: newWidth };
	else if (newHeight === 0) opts = { width: newWidth };
	else if (newWidth === 0) opts = { height: newHeight };
	if (compress) {
		opts.optimizationLevel = 2;
		opts.lossy = 120;
		// opts.colors = 64;
	}

	const image = await gifResize(opts)(buf);
	return fs.writeFileSync(output, image);
};

const convertToMp4 = async ({
	imagePath,
	newWidth = 0,
	newHeight = 0,
	output,
}: {
	imagePath: string;
	newWidth?: number;
	newHeight?: number;
	output: string;
}): Promise<boolean> => {
	try {
		let scale = "";
		if (newWidth === 0 && newHeight === 0)
			throw new Error("Width or height must be set");
		if (newWidth !== 0 && newHeight !== 0)
			scale = `scale=${newWidth}:${newHeight}`;
		else if (newHeight === 0) scale = `scale=${newWidth}:-2`;
		else if (newWidth === 0) scale = `scale=-2:${newHeight}`;

		const { stdout } = await execa("ffmpeg", [
			"-i",
			imagePath,
			"-movflags",
			"faststart",
			"-pix_fmt",
			"yuv420p",
			"-vf",
			scale,
			output,
		]);

		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

const getFileSize = (path: string) => {
	const stats = fs.statSync(path);
	return stats.size;
};

const generateScreenshot = async ({
	path,
	output,
}: {
	path: string;
	output: string;
}): Promise<boolean> => {
	try {
		const { stdout } = await execa("ffmpeg", [
			"-i",
			path,
			"-vframes",
			"1",
			output,
		]);

		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export {
	getImageSize,
	resizeImage,
	closestSizeRatio,
	getImageOrientation,
	ImageOrientation,
	ImageMaxDimensions,
	convertToMp4,
	MediaFilter,
	getFileSize,
	generateScreenshot,
};
