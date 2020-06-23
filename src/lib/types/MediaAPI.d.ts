export interface APIResultType {
	weburl: string;
	results: Array<GifResultType>;
}

export interface RelatedArr {
	related?: Array<GifResultType>;
}

export type APIResultRelated = APIResultType & RelatedArr;

export interface GifResultType {
	title: string;
	itemurl: string;
	tags: Array<string> | Array<{ text: string; color: string }>;
	media: MediaParentType;
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
