import { getAllQuestions } from '../shared/storage';

// ── Badge update ──

async function updateBadge() {
    try {
        const all = await getAllQuestions();
        const count = Object.keys(all).length;
        const text = count > 0 ? String(count) : '';
        await chrome.action.setBadgeText({ text });
        await chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
    } catch (e) {
        // Ignore errors during startup
    }
}

// Update badge on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('[GO Enhancer] Extension installed');
    updateBadge();
});

// Update badge on startup
chrome.runtime.onStartup.addListener(() => {
    updateBadge();
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'QUESTIONS_UPDATED') {
        updateBadge();
        sendResponse({ ok: true });
    }

    if (message.type === 'GET_STATS') {
        getAllQuestions().then((all) => {
            sendResponse({ count: Object.keys(all).length });
        });
        return true; // Keep channel open for async response
    }
});

// Update badge when storage changes
chrome.storage.onChanged.addListener((_changes, namespace) => {
    if (namespace === 'local') {
        updateBadge();
    }
});
