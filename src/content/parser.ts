import { QuestionMeta, defaultUserData, StoredQuestion } from '../shared/types';
import { YEAR_REGEX } from '../shared/constants';

/**
 * Extract question ID from a GateOverflow URL.
 * URL pattern: https://gateoverflow.in/523157/gate-cse-2026-set-2-ga-question-1
 */
export function extractIdFromUrl(url: string): string | null {
    const match = url.match(/gateoverflow\.in\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Extract year from a question title.
 * e.g. "GATE CSE 2026 | Set 2 | GA | Question: 1" → 2026
 */
export function extractYear(title: string): number | null {
    const match = title.match(YEAR_REGEX);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse questions from a question LIST page.
 * Each item has class `.qa-q-list-item`.
 */
export function parseQuestionList(): StoredQuestion[] {
    const items = document.querySelectorAll('.qa-q-list-item');
    const questions: StoredQuestion[] = [];

    items.forEach((item) => {
        try {
            const titleEl = item.querySelector('.qa-q-item-title a') as HTMLAnchorElement | null;
            if (!titleEl) return;

            const url = titleEl.href;
            const id = extractIdFromUrl(url);
            if (!id) return;

            const title = titleEl.textContent?.trim() || '';

            // Body snippet
            const contentEl = item.querySelector('.qa-q-item-content');
            const bodySnippet = contentEl?.textContent?.trim().substring(0, 300) || '';

            // Tags (only from this item, not globally)
            const tagEls = item.querySelectorAll('.qa-tag-link');
            const goTags = Array.from(tagEls).map((t) => t.textContent?.trim() || '');

            // Votes
            const voteEl = item.querySelector('.qa-netvote-count-data');
            const votes = parseInt(voteEl?.textContent?.trim() || '0', 10) || 0;

            // Answers
            const ansEl = item.querySelector('.qa-a-count-data');
            const answers = parseInt(ansEl?.textContent?.trim() || '0', 10) || 0;

            // Views
            const viewEl = item.querySelector('.qa-view-count-data');
            const viewText = viewEl?.textContent?.trim() || '0';
            const views = parseInt(viewText.replace(/[^0-9]/g, ''), 10) || 0;

            // Category / subject
            const catEl = item.querySelector('.qa-category-link');
            const subject = catEl?.textContent?.trim() || '';

            // Year
            const year = extractYear(title);

            const now = Date.now();
            questions.push({
                id,
                url,
                title,
                bodySnippet,
                year,
                subject,
                goTags: goTags.filter(Boolean),
                views,
                votes,
                answers,
                storedAt: now,
                updatedAt: now,
                userData: defaultUserData(),
            });
        } catch (e) {
            console.warn('[GO Enhancer] Failed to parse question item:', e);
        }
    });

    return questions;
}

/**
 * Parse a single question from a DETAIL page.
 * The main question element has class `.qa-q-view`.
 */
export function parseQuestionDetail(): StoredQuestion | null {
    try {
        // Title from h1 inside .qa-main-heading
        const headingEl = document.querySelector('.qa-main-heading h1, .qa-main-heading');
        const title = headingEl?.textContent?.trim() || document.title;

        // URL & ID
        const url = window.location.href;
        const id = extractIdFromUrl(url);
        if (!id) return null;

        // Body content
        const bodyEl = document.querySelector('.qa-q-view-content');
        const bodySnippet = bodyEl?.textContent?.trim().substring(0, 300) || '';

        // Tags — scope to the question view only (not related questions)
        const qView = document.querySelector('.qa-q-view');
        const tagEls = qView
            ? qView.querySelectorAll('.qa-q-view-tag-list .qa-tag-link')
            : document.querySelectorAll('.qa-q-view-tag-list .qa-tag-link');
        const goTags = Array.from(tagEls).map((t) => t.textContent?.trim() || '');

        // Votes
        const voteEl = qView?.querySelector('.qa-netvote-count-data');
        const votes = parseInt(voteEl?.textContent?.trim() || '0', 10) || 0;

        // Views
        const viewEl = qView?.querySelector('.qa-view-count');
        const viewText = viewEl?.textContent?.trim() || '0';
        const views = parseInt(viewText.replace(/[^0-9]/g, ''), 10) || 0;

        // Category
        const catEl = qView?.querySelector('.qa-category-link');
        const subject = catEl?.textContent?.trim() || '';

        // Year
        const year = extractYear(title);

        const now = Date.now();
        return {
            id,
            url,
            title,
            bodySnippet,
            year,
            subject,
            goTags: goTags.filter(Boolean),
            views,
            votes,
            answers: 0,
            storedAt: now,
            updatedAt: now,
            userData: defaultUserData(),
        };
    } catch (e) {
        console.warn('[GO Enhancer] Failed to parse question detail:', e);
        return null;
    }
}

/**
 * Detect page type from the current URL / DOM.
 */
export function detectPageType(): 'list' | 'detail' | 'unknown' {
    // Detail page has .qa-q-view
    if (document.querySelector('.qa-q-view')) return 'detail';
    // List page has .qa-q-list-item
    if (document.querySelectorAll('.qa-q-list-item').length > 0) return 'list';
    return 'unknown';
}
