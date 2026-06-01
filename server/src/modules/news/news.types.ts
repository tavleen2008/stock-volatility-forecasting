import {z} from "zod";

export type NewsArticle = {
    id: string;
    title: string;
    description: string | null;
    source: string | null;
    articleUrl: string;
    publishedAt: Date;
    createdAt: Date;
    updatedAt?: Date;
    symbol: string;
};

export type newsArraySchema=NewsArticle[];
