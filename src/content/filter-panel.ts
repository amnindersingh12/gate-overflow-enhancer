/**
 * In-page filter panel injected into GateOverflow question list pages.
 * Hides/shows questions on the current page based on subject, mark type, and topic tags.
 * Filter state persists across page loads via chrome.storage.local.
 */

const FILTER_PANEL_ID = 'go-filter-panel';
const FILTER_STATE_KEY = 'go_filter_state';

interface FilterState {
    subject: string;
    markType: 'any' | '1-mark' | '2-mark';
    topics: string[];
    searchText: string;
}

const DEFAULT_STATE: FilterState = {
    subject: '',
    markType: 'any',
    topics: [],
    searchText: '',
};

/** Save filter state to chrome.storage */
function saveFilterState(state: FilterState) {
    try {
        chrome.storage.local.set({ [FILTER_STATE_KEY]: state });
    } catch (e) {
        // Fallback: ignore if storage unavailable
    }
}

/** Load filter state from chrome.storage */
async function loadFilterState(): Promise<FilterState> {
    try {
        const result = await chrome.storage.local.get(FILTER_STATE_KEY);
        return result[FILTER_STATE_KEY] || { ...DEFAULT_STATE };
    } catch (e) {
        return { ...DEFAULT_STATE };
    }
}

/**
 * Collect all unique subjects and tags from the current page's questions.
 */
function collectPageData() {
    const items = document.querySelectorAll('.qa-q-list-item');
    const subjects = new Set<string>();
    const tags = new Set<string>();

    items.forEach((item) => {
        const catEl = item.querySelector('.qa-category-link');
        if (catEl?.textContent?.trim()) subjects.add(catEl.textContent.trim());

        item.querySelectorAll('.qa-tag-link').forEach((t) => {
            const tag = t.textContent?.trim();
            if (tag && tag !== 'one-mark' && tag !== 'two-mark') {
                tags.add(tag);
            }
        });
    });

    return {
        subjects: Array.from(subjects).sort(),
        tags: Array.from(tags).sort(),
        totalQuestions: items.length,
    };
}

/**
 * Apply filters: hide questions that don't match, show those that do.
 */
function applyPageFilter(state: FilterState) {
    const items = document.querySelectorAll('.qa-q-list-item');
    let shown = 0;
    let hidden = 0;

    items.forEach((item) => {
        const el = item as HTMLElement;

        const catEl = item.querySelector('.qa-category-link');
        const questionSubject = catEl?.textContent?.trim() || '';

        const tagEls = item.querySelectorAll('.qa-tag-link');
        const questionTags = Array.from(tagEls).map((t) => t.textContent?.trim()?.toLowerCase() || '');

        const titleEl = item.querySelector('.qa-q-item-title a');
        const title = titleEl?.textContent?.trim()?.toLowerCase() || '';

        const bodyEl = item.querySelector('.qa-q-item-content');
        const body = bodyEl?.textContent?.trim()?.toLowerCase() || '';

        let visible = true;

        if (state.subject && questionSubject !== state.subject) {
            visible = false;
        }

        if (state.markType !== 'any') {
            const hasOneMark = questionTags.includes('one-mark');
            const hasTwoMark = questionTags.includes('two-mark');
            if (state.markType === '1-mark' && !hasOneMark) visible = false;
            if (state.markType === '2-mark' && !hasTwoMark) visible = false;
        }

        if (state.topics.length > 0) {
            const hasAny = state.topics.some((t) => questionTags.includes(t.toLowerCase()));
            if (!hasAny) visible = false;
        }

        if (state.searchText) {
            const q = state.searchText.toLowerCase();
            if (!title.includes(q) && !body.includes(q) && !questionTags.some((t) => t.includes(q))) {
                visible = false;
            }
        }

        el.style.display = visible ? '' : 'none';
        if (visible) shown++;
        else hidden++;
    });

    const countEl = document.getElementById('go-filter-count');
    if (countEl) {
        countEl.textContent = `Showing ${shown} of ${shown + hidden} questions`;
    }

    // Persist state
    saveFilterState(state);
}

/**
 * Build and inject the filter panel into the page.
 */
export async function injectFilterPanel() {
    if (document.querySelectorAll('.qa-q-list-item').length === 0) return;
    if (document.getElementById(FILTER_PANEL_ID)) return;

    const { subjects, tags } = collectPageData();

    // Load persisted filter state
    const state: FilterState = await loadFilterState();

    // Create panel
    const panel = document.createElement('div');
    panel.id = FILTER_PANEL_ID;
    panel.innerHTML = `
    <div class="go-fp-header">
      <span class="go-fp-logo">🎯 GATE Filter</span>
      <button class="go-fp-toggle" id="go-fp-toggle" title="Collapse">◀</button>
    </div>
    <div class="go-fp-body" id="go-fp-body">
      <div class="go-fp-section">
        <input type="text" id="go-fp-search" class="go-fp-input"
               placeholder="🔍 Search questions…"
               value="${state.searchText.replace(/"/g, '&quot;')}" />
      </div>

      <div class="go-fp-section">
        <label class="go-fp-label">Subject</label>
        <select id="go-fp-subject" class="go-fp-select">
          <option value="">All Subjects</option>
          ${subjects.map((s) => `<option value="${s}"${s === state.subject ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>

      <div class="go-fp-section">
        <label class="go-fp-label">Mark Type</label>
        <div class="go-fp-mark-btns">
          <button class="go-fp-mark-btn${state.markType === 'any' ? ' go-fp-mark-btn--active' : ''}" data-mark="any">All</button>
          <button class="go-fp-mark-btn${state.markType === '1-mark' ? ' go-fp-mark-btn--active' : ''}" data-mark="1-mark">1 Mark</button>
          <button class="go-fp-mark-btn${state.markType === '2-mark' ? ' go-fp-mark-btn--active' : ''}" data-mark="2-mark">2 Marks</button>
        </div>
      </div>

      <div class="go-fp-section">
        <label class="go-fp-label">Topics <span class="go-fp-label-hint">(click to select)</span></label>
        <div class="go-fp-topics" id="go-fp-topics">
          ${tags
            .map(
                (t) =>
                    `<span class="go-fp-topic${state.topics.includes(t) ? ' go-fp-topic--selected' : ''}" data-topic="${t}">${t}</span>`
            )
            .join('')}
        </div>
      </div>

      <div class="go-fp-actions">
        <button id="go-fp-apply" class="go-fp-btn go-fp-btn--primary">Apply Filter</button>
        <button id="go-fp-clear" class="go-fp-btn go-fp-btn--ghost">Clear</button>
      </div>

      <div id="go-filter-count" class="go-fp-count"></div>
    </div>
  `;

    document.body.appendChild(panel);

    // ── Event Handlers ──

    // Toggle collapse
    const toggleBtn = document.getElementById('go-fp-toggle')!;
    const body = document.getElementById('go-fp-body')!;
    let collapsed = false;
    toggleBtn.addEventListener('click', () => {
        collapsed = !collapsed;
        body.style.display = collapsed ? 'none' : '';
        panel.classList.toggle('go-fp--collapsed', collapsed);
        toggleBtn.textContent = collapsed ? '▶' : '◀';
        toggleBtn.title = collapsed ? 'Expand' : 'Collapse';
    });

    // Subject
    document.getElementById('go-fp-subject')!.addEventListener('change', (e) => {
        state.subject = (e.target as HTMLSelectElement).value;
    });

    // Mark type buttons
    panel.querySelectorAll('.go-fp-mark-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            panel.querySelectorAll('.go-fp-mark-btn').forEach((b) => b.classList.remove('go-fp-mark-btn--active'));
            btn.classList.add('go-fp-mark-btn--active');
            state.markType = (btn as HTMLElement).dataset.mark as any;
        });
    });

    // Topic selection
    panel.querySelectorAll('.go-fp-topic').forEach((topicEl) => {
        topicEl.addEventListener('click', () => {
            topicEl.classList.toggle('go-fp-topic--selected');
            const topic = (topicEl as HTMLElement).dataset.topic!;
            if (state.topics.includes(topic)) {
                state.topics = state.topics.filter((t) => t !== topic);
            } else {
                state.topics.push(topic);
            }
        });
    });

    // Search
    document.getElementById('go-fp-search')!.addEventListener('input', (e) => {
        state.searchText = (e.target as HTMLInputElement).value;
    });

    // Search on Enter
    document.getElementById('go-fp-search')!.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyPageFilter(state);
    });

    // Apply
    document.getElementById('go-fp-apply')!.addEventListener('click', () => {
        applyPageFilter(state);
    });

    // Clear
    document.getElementById('go-fp-clear')!.addEventListener('click', () => {
        state.subject = '';
        state.markType = 'any';
        state.topics = [];
        state.searchText = '';

        (document.getElementById('go-fp-subject') as HTMLSelectElement).value = '';
        (document.getElementById('go-fp-search') as HTMLInputElement).value = '';
        panel.querySelectorAll('.go-fp-mark-btn').forEach((b, i) => {
            b.classList.toggle('go-fp-mark-btn--active', i === 0);
        });
        panel.querySelectorAll('.go-fp-topic--selected').forEach((t) => {
            t.classList.remove('go-fp-topic--selected');
        });

        // Show all questions
        document.querySelectorAll('.qa-q-list-item').forEach((item) => {
            (item as HTMLElement).style.display = '';
        });
        const countEl = document.getElementById('go-filter-count');
        if (countEl) countEl.textContent = '';

        // Clear persisted state
        saveFilterState({ ...DEFAULT_STATE });
    });

    // Auto-apply if there was a persisted filter
    const hasActiveFilter = state.subject || state.markType !== 'any' || state.topics.length > 0 || state.searchText;
    if (hasActiveFilter) {
        applyPageFilter(state);
    }
}
