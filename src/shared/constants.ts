/** GateOverflow subject categories */
export const SUBJECTS = [
    'General Aptitude',
    'Engineering Mathematics',
    'Digital Logic',
    'Programming and DS',
    'Algorithms',
    'Theory of Computation',
    'Compiler Design',
    'Operating System',
    'Databases',
    'CO & Architecture',
    'Computer Networks',
    'Artificial Intelligence',
    'Machine Learning',
    'Others',
] as const;

/** Default custom tags the user can start with */
export const DEFAULT_CUSTOM_TAGS = [
    'previous-year-gate',
    'one-mark',
    'two-mark',
    'must-revise',
    'weak-topic',
    'easy',
    'tricky',
    'important',
    'done',
    'skip',
] as const;

/** Regex to extract GATE year from question title */
export const YEAR_REGEX = /GATE\s*(?:CSE|DA|IT|EC|EE|ME|CE|IN)?\s*(\d{4})/i;

/** Regex to extract set number */
export const SET_REGEX = /Set\s*(\d)/i;

/** Regex to extract question number */
export const QUESTION_NUM_REGEX = /Question[:\s]*(\d+)/i;

/** Color palette for custom tag chips */
export const TAG_COLORS: Record<string, string> = {
    'previous-year-gate': '#1e40af',
    'one-mark': '#0891b2',
    'two-mark': '#7c3aed',
    'must-revise': '#e74c3c',
    'weak-topic': '#e67e22',
    'easy': '#27ae60',
    'tricky': '#8e44ad',
    'important': '#2980b9',
    'done': '#16a085',
    'skip': '#95a5a6',
};

/** Get a color for any tag (fallback to hash-based color) */
export function getTagColor(tag: string): string {
    if (TAG_COLORS[tag]) return TAG_COLORS[tag];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 50%)`;
}
