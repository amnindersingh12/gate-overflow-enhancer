// ── Question metadata parsed from GateOverflow DOM ──

export interface QuestionMeta {
    /** Unique ID extracted from URL path, e.g. "523157" */
    id: string;
    /** Full URL to the question on GateOverflow */
    url: string;
    /** Question title text */
    title: string;
    /** Body text snippet (first ~300 chars) */
    bodySnippet: string;
    /** GATE year parsed from title, e.g. 2026 */
    year: number | null;
    /** Subject / category from GateOverflow (e.g. "Verbal Aptitude") */
    subject: string;
    /** GateOverflow tags (e.g. ["verbal-aptitude", "one-mark"]) */
    goTags: string[];
    /** View count */
    views: number;
    /** Net vote count */
    votes: number;
    /** Answer count */
    answers: number;
    /** Timestamp when this was first stored */
    storedAt: number;
    /** Timestamp when this was last updated */
    updatedAt: number;
}

// ── User's personal data for a question ──

export interface UserQuestionData {
    /** User-assigned custom tags */
    customTags: string[];
    /** Difficulty rating 1-5 (0 = unrated) */
    difficulty: number;
    /** Mark type: "1-mark", "2-mark", or null */
    markType: '1-mark' | '2-mark' | null;
    /** Priority: "low", "medium", "high", or null */
    priority: 'low' | 'medium' | 'high' | null;
    /** Free-text personal notes */
    notes: string;
}

// ── Combined stored question ──

export interface StoredQuestion extends QuestionMeta {
    userData: UserQuestionData;
}

// ── Filter criteria for the popup ──

export interface FilterCriteria {
    goTags: string[];
    customTags: string[];
    tagLogic: 'AND' | 'OR';
    difficultyMin: number;
    difficultyMax: number;
    yearMin: number | null;
    yearMax: number | null;
    subject: string;
    searchText: string;
    markType: '1-mark' | '2-mark' | 'any';
}

// ── Quiz session ──

export interface QuizQuestion {
    questionId: string;
    result: 'correct' | 'wrong' | 'skipped' | 'pending';
}

export interface QuizSession {
    id: string;
    startedAt: number;
    questions: QuizQuestion[];
    currentIndex: number;
    isComplete: boolean;
}

// ── Storage keys ──

export const STORAGE_KEYS = {
    QUESTIONS: 'go_questions',
    CUSTOM_TAGS: 'go_custom_tags',
    QUIZ_SESSION: 'go_quiz_session',
    QUIZ_HISTORY: 'go_quiz_history',
} as const;

// ── Message types between content ↔ popup ↔ background ──

export type MessageType =
    | { type: 'GET_QUESTIONS'; payload?: FilterCriteria }
    | { type: 'SAVE_QUESTION'; payload: StoredQuestion }
    | { type: 'GET_QUESTION'; payload: { id: string } }
    | { type: 'GET_STATS' }
    | { type: 'QUESTIONS_UPDATED' }
    | { type: 'PARSE_PAGE' };

export function defaultUserData(): UserQuestionData {
    return {
        customTags: [],
        difficulty: 0,
        markType: null,
        priority: null,
        notes: '',
    };
}
