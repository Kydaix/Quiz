export interface ImageRef {
    url: string;
    width: number;
    height: number;
}

export interface Artist {
    id: string;
    name: string;
    images?: ImageRef[];
}
