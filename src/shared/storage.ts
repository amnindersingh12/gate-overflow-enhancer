import {
    StoredQuestion,
    FilterCriteria,
    QuizSession,
    STORAGE_KEYS,
    UserQuestionData,
    defaultUserData,
} from './types';
import { DEFAULT_CUSTOM_TAGS } from './constants';

// ══════════════════════════════════════════
//  Question CRUD
// ══════════════════════════════════════════

/** Get all stored questions as a map: id → StoredQuestion */
export async function getAllQuestions(): Promise<Record<string, StoredQuestion>> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.QUESTIONS);
    return result[STORAGE_KEYS.QUESTIONS] || {};
}

/** Get a single question by ID */
export async function getQuestion(id: string): Promise<StoredQuestion | null> {
    const all = await getAllQuestions();
    return all[id] || null;
}

/** Save or update a question (merges with existing userData if present) */
export async function saveQuestion(q: StoredQuestion): Promise<void> {
    const all = await getAllQuestions();
    const existing = all[q.id];

    if (existing) {
        // Merge: keep existing userData, update meta
        all[q.id] = {
            ...q,
            userData: { ...existing.userData, ...q.userData },
            storedAt: existing.storedAt,
            updatedAt: Date.now(),
        };
    } else {
        all[q.id] = { ...q, storedAt: Date.now(), updatedAt: Date.now() };
    }

    await chrome.storage.local.set({ [STORAGE_KEYS.QUESTIONS]: all });
}

/** Update only the user data for a question */
export async function updateUserData(
    id: string,
    updates: Partial<UserQuestionData>
): Promise<void> {
    const all = await getAllQuestions();
    if (!all[id]) return;
    all[id].userData = { ...all[id].userData, ...updates };
    all[id].updatedAt = Date.now();
    await chrome.storage.local.set({ [STORAGE_KEYS.QUESTIONS]: all });
}

/** Delete a question */
export async function deleteQuestion(id: string): Promise<void> {
    const all = await getAllQuestions();
    delete all[id];
    await chrome.storage.local.set({ [STORAGE_KEYS.QUESTIONS]: all });
}

// ══════════════════════════════════════════
//  Custom Tags
// ══════════════════════════════════════════

export async function getCustomTags(): Promise<string[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CUSTOM_TAGS);
    return result[STORAGE_KEYS.CUSTOM_TAGS] || [...DEFAULT_CUSTOM_TAGS];
}

export async function addCustomTag(tag: string): Promise<void> {
    const tags = await getCustomTags();
    if (!tags.includes(tag)) {
        tags.push(tag);
        await chrome.storage.local.set({ [STORAGE_KEYS.CUSTOM_TAGS]: tags });
    }
}

export async function removeCustomTag(tag: string): Promise<void> {
    let tags = await getCustomTags();
    tags = tags.filter((t) => t !== tag);
    await chrome.storage.local.set({ [STORAGE_KEYS.CUSTOM_TAGS]: tags });
}

// ══════════════════════════════════════════
//  Filtering
// ══════════════════════════════════════════

export async function filterQuestions(
    criteria: FilterCriteria
): Promise<StoredQuestion[]> {
    const all = await getAllQuestions();
    let questions = Object.values(all);

    // Text search
    if (criteria.searchText.trim()) {
        const lower = criteria.searchText.toLowerCase();
        questions = questions.filter(
            (q) =>
                q.title.toLowerCase().includes(lower) ||
                q.bodySnippet.toLowerCase().includes(lower)
        );
    }

    // Subject
    if (criteria.subject) {
        questions = questions.filter((q) => q.subject === criteria.subject);
    }

    // Year range
    if (criteria.yearMin !== null) {
        questions = questions.filter(
            (q) => q.year !== null && q.year >= criteria.yearMin!
        );
    }
    if (criteria.yearMax !== null) {
        questions = questions.filter(
            (q) => q.year !== null && q.year <= criteria.yearMax!
        );
    }

    // Difficulty range
    if (criteria.difficultyMin > 0) {
        questions = questions.filter(
            (q) => q.userData.difficulty >= criteria.difficultyMin
        );
    }
    if (criteria.difficultyMax > 0 && criteria.difficultyMax < 5) {
        questions = questions.filter(
            (q) => q.userData.difficulty <= criteria.difficultyMax
        );
    }

    // Mark type
    if (criteria.markType !== 'any') {
        questions = questions.filter(
            (q) => q.userData.markType === criteria.markType
        );
    }

    // GateOverflow tags
    if (criteria.goTags.length > 0) {
        if (criteria.tagLogic === 'AND') {
            questions = questions.filter((q) =>
                criteria.goTags.every((t) => q.goTags.includes(t))
            );
        } else {
            questions = questions.filter((q) =>
                criteria.goTags.some((t) => q.goTags.includes(t))
            );
        }
    }

    // Custom tags
    if (criteria.customTags.length > 0) {
        if (criteria.tagLogic === 'AND') {
            questions = questions.filter((q) =>
                criteria.customTags.every((t) => q.userData.customTags.includes(t))
            );
        } else {
            questions = questions.filter((q) =>
                criteria.customTags.some((t) => q.userData.customTags.includes(t))
            );
        }
    }

    return questions;
}

// ══════════════════════════════════════════
//  Quiz Session
// ══════════════════════════════════════════

export async function saveQuizSession(session: QuizSession): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.QUIZ_SESSION]: session });
}

export async function getQuizSession(): Promise<QuizSession | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.QUIZ_SESSION);
    return result[STORAGE_KEYS.QUIZ_SESSION] || null;
}

export async function clearQuizSession(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.QUIZ_SESSION);
}

// ══════════════════════════════════════════
//  Export / Import
// ══════════════════════════════════════════

export async function exportAllData(): Promise<string> {
    const questions = await getAllQuestions();
    const customTags = await getCustomTags();
    return JSON.stringify({ questions, customTags, exportedAt: Date.now() }, null, 2);
}

export async function importData(json: string): Promise<{ imported: number }> {
    const data = JSON.parse(json);

    if (data.questions && typeof data.questions === 'object') {
        const existing = await getAllQuestions();
        // Merge: imported data overrides
        const merged = { ...existing, ...data.questions };
        await chrome.storage.local.set({ [STORAGE_KEYS.QUESTIONS]: merged });
    }

    if (Array.isArray(data.customTags)) {
        const existing = await getCustomTags();
        const merged = [...new Set([...existing, ...data.customTags])];
        await chrome.storage.local.set({ [STORAGE_KEYS.CUSTOM_TAGS]: merged });
    }

    const count = data.questions ? Object.keys(data.questions).length : 0;
    return { imported: count };
}

export async function clearAllData(): Promise<void> {
    await chrome.storage.local.clear();
}
