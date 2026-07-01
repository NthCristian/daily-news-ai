export const NewsConfig = {
    rssProviders: [
        "https://g1.globo.com/rss/g1/",
        "https://noticiabrasil.net.br/export/rss2/archive/index.xml",
        "https://www.wired.com/feed/rss",
        "https://feedx.net/rss/sputnik.xml",
        "https://www.theverge.com/rss/index.xml",
        "https://www.technologyreview.com/topic/artificial-intelligence/feed/",
    ] as const,

    /** Maximum characters per feed to send to the LLM (token limit safeguard) */
    maxFeedChars: 12000,
} as const;
