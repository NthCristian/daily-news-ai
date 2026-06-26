export type NewsItem = {
    title: string;
    summary: string;
    publisher: string;
    source: string;
};

export type SummarizedNews = Record<string, NewsItem[]>;
