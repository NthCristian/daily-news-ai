import type { SummarizedNews, NewsItem } from "../news/types";

/** Telegram Bot API maximum message length in UTF-8 characters */
export const MAX_TELEGRAM_MESSAGE_LENGTH = 4096;

export class MessageFormatter {
    /**
     * Formats a SummarizedNews object into one or more Telegram-friendly HTML
     * messages, grouped by category. Each chunk is ≤ {@link MAX_TELEGRAM_MESSAGE_LENGTH}
     * characters and split at a category boundary when possible.
     *
     * Uses Telegram's limited HTML subset: <b>, <i>, <u>, <a href="">.
     */
    formatNewsSummary(news: SummarizedNews): string[] {
        const categories = Object.entries(news);

        if (categories.length === 0) {
            return ["<b>📰 Nenhuma notícia encontrada hoje.</b>"];
        }

        // Build per-category blocks, each category header + its items
        const categoryBlocks = categories
            .filter(([, items]) => items.length > 0)
            .map(([category, items]) => {
                const header = `\n<b>${this.escapeHtml(category)}</b>`;
                const body = items
                    .map((item) => this.formatItem(item))
                    .join("");
                return header + body;
            });

        const header = "<b>📰 Resumo de Notícias</b>\n";
        return this.chunkMessages(header, categoryBlocks);
    }

    /**
     * Distributes a header + category blocks across multiple messages,
     * ensuring each message stays within the character limit.
     */
    private chunkMessages(header: string, blocks: string[]): string[] {
        const chunks: string[] = [];
        let current = header;

        for (const block of blocks) {
            const candidate = current + block;

            if (candidate.length <= MAX_TELEGRAM_MESSAGE_LENGTH) {
                // Block fits in current chunk
                current = candidate;
            } else if (block.length <= MAX_TELEGRAM_MESSAGE_LENGTH) {
                // Block doesn't fit current → start new chunk
                chunks.push(current);
                current = header + block;
            } else {
                // Edge case: single block exceeds limit → push current, force-split block
                if (current !== header) {
                    chunks.push(current);
                }
                current = header + block;
                while (current.length > MAX_TELEGRAM_MESSAGE_LENGTH) {
                    const splitAt = current.lastIndexOf(
                        "\n",
                        MAX_TELEGRAM_MESSAGE_LENGTH,
                    );
                    const cutPoint =
                        splitAt > header.length
                            ? splitAt
                            : MAX_TELEGRAM_MESSAGE_LENGTH;
                    chunks.push(current.substring(0, cutPoint));
                    current = header + current.substring(cutPoint);
                }
            }
        }

        if (current !== header) {
            chunks.push(current);
        }

        return chunks;
    }

    /** Formats a single news item into a compact block */
    private formatItem(item: NewsItem): string {
        const title = this.escapeHtml(item.title);
        const summary = this.escapeHtml(item.summary);
        const publisher = this.escapeHtml(item.publisher);
        const source = this.escapeHtml(item.source);

        let block = `\n▸ <b>${title}</b>\n`;
        block += `  <i>${summary}</i>\n`;

        const meta: string[] = [];
        if (publisher) meta.push(`📝 ${publisher}`);
        if (source) meta.push(`🔗 ${source}`);
        if (meta.length > 0) block += `  ${meta.join(" • ")}\n`;

        return block;
    }

    /** Escapes HTML special characters for Telegram HTML parse mode */
    private escapeHtml(text: string): string {
        const entities: Record<string, string> = {
            "&": "&" + "amp;",
            "<": "&" + "lt;",
            ">": "&" + "gt;",
        };
        return text.replace(/[&<>]/g, (ch) => entities[ch] ?? ch);
    }
}
