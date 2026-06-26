export const NewsConfig = {
    rssProviders: [
        "https://g1.globo.com/rss/g1/",
        "https://noticiabrasil.net.br/export/rss2/archive/index.xml",
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "https://hnrss.org/frontpage",
        "https://www.wired.com/feed/rss",
        "https://feedx.net/rss/sputnik.xml",
    ] as const,

    /** Maximum characters per feed to send to the LLM (token limit safeguard) */
    maxFeedChars: 8000,
} as const;
