import fs from "fs-extra";
import gifResize from "imagemin-gifsicle";
import { promisify } from "util";

const sizeOf = promisify(require("image-size"));

// https://tenor.com/gifapi/documentation#responseobjects-gifformat
const ImageMaxDimensions = {
	gif: {
		format: "gif",
	},
	mediumgif: {
		format: "gif",
		compress: 1,
	},
	tinygif: {
		format: "gif",
		width: 220,
		compress: 1,
	},
	nanogif: {
		format: "gif",
		height: 90,
		compress: 1,
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
		return {
			width: Math.round(((width * 1.0) / height) * maxHeight),
			height: maxHeight,
		};
	}

	if (maxWidth !== 0) {
		if (maxWidth > width) return { width, height };
		return {
			width: maxWidth,
			height: Math.round(((height * 1.0) / width) * maxWidth),
		};
	}
};

const resizeImage = async ({
	imagePath,
	newWidth = 0,
	newHeight = 0,
	compress = 0,
	output,
}: {
	imagePath: string;
	newWidth?: number;
	newHeight?: number;
	output: string;
	compress: number;
}) => {
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
	if (compress === 1) {
		opts.optimizationLevel = 2;
		opts.lossy = 120;
		// opts.colors = 64;
	}

	const image = await gifResize(opts)(buf);
	fs.writeFileSync(output, image);
};

export {
	getImageSize,
	resizeImage,
	closestSizeRatio,
	getImageOrientation,
	ImageOrientation,
	ImageMaxDimensions,
};
