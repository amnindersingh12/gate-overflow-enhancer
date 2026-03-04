import { detectPageType, parseQuestionList, parseQuestionDetail } from './parser';
import { injectListUI, injectDetailUI } from './injector';
import { injectFilterPanel } from './filter-panel';
import { injectPageLoader } from './page-loader';
import { saveQuestion, getQuestion } from '../shared/storage';
import { StoredQuestion } from '../shared/types';

console.log('[GO Enhancer] Content script loaded on:', window.location.href);

async function init() {
    const pageType = detectPageType();
    console.log('[GO Enhancer] Detected page type:', pageType);

    if (pageType === 'list') {
        await handleListPage();
    } else if (pageType === 'detail') {
        await handleDetailPage();
    }
}

async function handleListPage() {
    const questions = parseQuestionList();
    console.log(`[GO Enhancer] Parsed ${questions.length} questions from list`);

    // Save/update all parsed questions (preserve existing userData)
    for (const q of questions) {
        const existing = await getQuestion(q.id);
        if (existing) {
            await saveQuestion({ ...q, userData: existing.userData });
        } else {
            await saveQuestion(q);
        }
    }

    // Inject tagging UI
    await injectListUI(questions);

    // Inject in-page filter panel
    await injectFilterPanel();

    // Inject "Load All Pages" button
    injectPageLoader();

    // Update badge
    chrome.runtime?.sendMessage?.({ type: 'QUESTIONS_UPDATED' }).catch(() => { });
}

async function handleDetailPage() {
    const question = parseQuestionDetail();
    if (!question) {
        console.warn('[GO Enhancer] Could not parse question from detail page');
        return;
    }

    console.log(`[GO Enhancer] Parsed question: ${question.title}`);

    const existing = await getQuestion(question.id);
    if (existing) {
        await saveQuestion({ ...question, userData: existing.userData });
    } else {
        await saveQuestion(question);
    }

    await injectDetailUI(question);
    chrome.runtime?.sendMessage?.({ type: 'QUESTIONS_UPDATED' }).catch(() => { });
}

// Run on page load
init();

// When page-loader finishes loading all pages, re-parse & inject UI for new questions
window.addEventListener('go-pages-loaded', async () => {
    console.log('[GO Enhancer] All pages loaded, re-parsing questions');
    const questions = parseQuestionList();
    for (const q of questions) {
        const existing = await getQuestion(q.id);
        if (existing) {
            await saveQuestion({ ...q, userData: existing.userData });
        } else {
            await saveQuestion(q);
        }
    }
    await injectListUI(questions);
    // Rebuild filter panel to include topics from all pages
    const oldPanel = document.getElementById('go-filter-panel');
    if (oldPanel) oldPanel.remove();
    await injectFilterPanel();
    chrome.runtime?.sendMessage?.({ type: 'QUESTIONS_UPDATED' }).catch(() => { });
});

// SPA-like navigation detection
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('[GO Enhancer] URL changed, re-initializing');
        setTimeout(init, 500);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});
