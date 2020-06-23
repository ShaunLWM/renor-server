export interface APIResultType {
	weburl: string;
	results: Array<GifResultType>;
}

export interface APIResultRelated extends APIResultType {
	related?: Array<GifResultType>;
}

export interface GifResultType {
	title: string;
	itemurl: string;
	tags: Array<string> | Array<{ text: string; color: string }>;
	media: Array<MediaParentType>;
}

export interface MediaParentType {
	[key: string]: MediaChildType;
}

export interface MediaChildType {
	dims: Array<number>;
	url: string;
	preview: string;
	size: number;
}
