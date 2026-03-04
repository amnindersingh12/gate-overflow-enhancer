import {
    getAllQuestions,
    filterQuestions,
    getCustomTags,
    addCustomTag,
    removeCustomTag,
    exportAllData,
    importData,
    clearAllData,
    saveQuizSession,
    getQuizSession,
    clearQuizSession,
} from '../shared/storage';
import { StoredQuestion, FilterCriteria, QuizSession, QuizQuestion } from '../shared/types';
import { SUBJECTS, getTagColor } from '../shared/constants';

// ══════════════════════════════════════════
//  State
// ══════════════════════════════════════════

let currentResults: StoredQuestion[] = [];
let currentQuiz: QuizSession | null = null;

// ══════════════════════════════════════════
//  Init
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    await initTabs();
    await initFilterPanel();
    await initQuizPanel();
    await initSettingsPanel();
    await updateStats();
});

// ══════════════════════════════════════════
//  Tabs
// ══════════════════════════════════════════

async function initTabs() {
    const tabs = document.querySelectorAll('.go-tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('go-tab--active'));
            tab.classList.add('go-tab--active');

            const target = (tab as HTMLElement).dataset.tab!;
            document.querySelectorAll('.go-panel').forEach((p) => {
                (p as HTMLElement).classList.toggle('go-panel--hidden', p.id !== `panel-${target}`);
            });
        });
    });
}

// ══════════════════════════════════════════
//  Filter Panel
// ══════════════════════════════════════════

async function initFilterPanel() {
    // Populate subject dropdown
    const subjectSelect = document.getElementById('filter-subject') as HTMLSelectElement;
    SUBJECTS.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        subjectSelect.appendChild(opt);
    });

    // Populate GO tags from stored questions
    const allQuestions = await getAllQuestions();
    const allGoTags = new Set<string>();
    Object.values(allQuestions).forEach((q) => {
        q.goTags.forEach((t) => allGoTags.add(t));
    });
    const goTagsContainer = document.getElementById('go-tags-container')!;
    Array.from(allGoTags)
        .sort()
        .forEach((tag) => {
            const chip = createTagChip(tag, false);
            goTagsContainer.appendChild(chip);
        });

    // Populate custom tags
    const customTags = await getCustomTags();
    const customTagsContainer = document.getElementById('custom-tags-container')!;
    customTags.forEach((tag) => {
        const chip = createTagChip(tag, false, true);
        customTagsContainer.appendChild(chip);
    });

    // Logic toggle
    const logicOr = document.getElementById('logic-or')!;
    const logicAnd = document.getElementById('logic-and')!;
    logicOr.addEventListener('click', () => {
        logicOr.classList.add('go-logic-btn--active');
        logicAnd.classList.remove('go-logic-btn--active');
    });
    logicAnd.addEventListener('click', () => {
        logicAnd.classList.add('go-logic-btn--active');
        logicOr.classList.remove('go-logic-btn--active');
    });

    // Apply filter
    document.getElementById('btn-apply')!.addEventListener('click', applyFilters);

    // Clear filter
    document.getElementById('btn-clear')!.addEventListener('click', () => {
        (document.getElementById('search-text') as HTMLInputElement).value = '';
        (document.getElementById('filter-subject') as HTMLSelectElement).value = '';
        (document.getElementById('filter-mark') as HTMLSelectElement).value = 'any';
        (document.getElementById('year-min') as HTMLInputElement).value = '';
        (document.getElementById('year-max') as HTMLInputElement).value = '';
        (document.getElementById('diff-min') as HTMLSelectElement).value = '0';
        (document.getElementById('diff-max') as HTMLSelectElement).value = '0';

        document.querySelectorAll('.go-tag-pick--selected').forEach((el) => {
            el.classList.remove('go-tag-pick--selected');
        });

        logicOr.classList.add('go-logic-btn--active');
        logicAnd.classList.remove('go-logic-btn--active');

        document.getElementById('results-list')!.innerHTML = '';
        document.getElementById('result-count')!.textContent = '';
        currentResults = [];
    });

    // Search on Enter
    document.getElementById('search-text')!.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyFilters();
    });
}

function createTagChip(tag: string, selected: boolean, isCustom = false): HTMLElement {
    const chip = document.createElement('span');
    chip.className = `go-tag-pick${selected ? ' go-tag-pick--selected' : ''}`;
    chip.textContent = tag;
    chip.dataset.tag = tag;
    chip.dataset.custom = isCustom ? 'true' : 'false';

    chip.addEventListener('click', () => {
        chip.classList.toggle('go-tag-pick--selected');
    });

    return chip;
}

function getFilterCriteria(): FilterCriteria {
    const searchText = (document.getElementById('search-text') as HTMLInputElement).value;
    const subject = (document.getElementById('filter-subject') as HTMLSelectElement).value;
    const markType = (document.getElementById('filter-mark') as HTMLSelectElement).value as any;
    const yearMinStr = (document.getElementById('year-min') as HTMLInputElement).value;
    const yearMaxStr = (document.getElementById('year-max') as HTMLInputElement).value;
    const diffMin = parseInt((document.getElementById('diff-min') as HTMLSelectElement).value, 10);
    const diffMax = parseInt((document.getElementById('diff-max') as HTMLSelectElement).value, 10);

    const goTagEls = document.querySelectorAll('#go-tags-container .go-tag-pick--selected');
    const goTags = Array.from(goTagEls).map((el) => (el as HTMLElement).dataset.tag!);

    const customTagEls = document.querySelectorAll('#custom-tags-container .go-tag-pick--selected');
    const customTags = Array.from(customTagEls).map((el) => (el as HTMLElement).dataset.tag!);

    const tagLogic = document.getElementById('logic-and')!.classList.contains('go-logic-btn--active')
        ? 'AND'
        : 'OR';

    return {
        searchText,
        subject,
        markType,
        goTags,
        customTags,
        tagLogic: tagLogic as 'AND' | 'OR',
        yearMin: yearMinStr ? parseInt(yearMinStr, 10) : null,
        yearMax: yearMaxStr ? parseInt(yearMaxStr, 10) : null,
        difficultyMin: diffMin,
        difficultyMax: diffMax,
    };
}

async function applyFilters() {
    const criteria = getFilterCriteria();
    currentResults = await filterQuestions(criteria);

    const resultCount = document.getElementById('result-count')!;
    resultCount.textContent = `${currentResults.length} found`;

    const resultsList = document.getElementById('results-list')!;
    resultsList.innerHTML = '';

    if (currentResults.length === 0) {
        resultsList.innerHTML = `
      <div class="go-empty">
        <span class="go-empty-icon">🔍</span>
        No questions match your filters.<br/>
        Try browsing GateOverflow first to collect questions.
      </div>`;
        return;
    }

    // Sort by year desc, then votes desc
    currentResults.sort((a, b) => {
        if (b.year !== a.year) return (b.year || 0) - (a.year || 0);
        return b.votes - a.votes;
    });

    currentResults.forEach((q) => {
        const card = document.createElement('a');
        card.className = 'go-result-card';
        card.href = q.url;
        card.target = '_blank';

        const title = document.createElement('div');
        title.className = 'go-result-title';
        title.textContent = q.title;

        const meta = document.createElement('div');
        meta.className = 'go-result-meta';
        meta.innerHTML = `
      <span>⬆ ${q.votes}</span>
      <span>👁 ${q.views}</span>
      ${q.year ? `<span>📅 ${q.year}</span>` : ''}
      ${q.subject ? `<span>📂 ${q.subject}</span>` : ''}
      ${q.userData.difficulty ? `<span>${'★'.repeat(q.userData.difficulty)}</span>` : ''}
    `;

        const tags = document.createElement('div');
        tags.className = 'go-result-tags';

        q.userData.customTags.forEach((t) => {
            const tag = document.createElement('span');
            tag.className = 'go-result-tag go-result-tag--custom';
            tag.textContent = t;
            tags.appendChild(tag);
        });

        if (q.userData.markType) {
            const tag = document.createElement('span');
            tag.className = 'go-result-tag';
            tag.textContent = q.userData.markType;
            tags.appendChild(tag);
        }

        card.appendChild(title);
        card.appendChild(meta);
        if (tags.children.length > 0) card.appendChild(tags);
        resultsList.appendChild(card);
    });

    // Update quiz pool info
    const poolInfo = document.getElementById('quiz-pool-info');
    if (poolInfo) {
        poolInfo.textContent = `${currentResults.length} questions available for quiz.`;
    }
}

// ══════════════════════════════════════════
//  Quiz Panel
// ══════════════════════════════════════════

async function initQuizPanel() {
    // Check for existing session
    const existing = await getQuizSession();
    if (existing && !existing.isComplete) {
        currentQuiz = existing;
        showQuizQuestion();
    }

    document.getElementById('btn-start-quiz')!.addEventListener('click', startQuiz);
    document.getElementById('quiz-correct')!.addEventListener('click', () => answerQuiz('correct'));
    document.getElementById('quiz-wrong')!.addEventListener('click', () => answerQuiz('wrong'));
    document.getElementById('quiz-skip')!.addEventListener('click', () => answerQuiz('skipped'));
    document.getElementById('btn-new-quiz')!.addEventListener('click', () => {
        document.getElementById('quiz-setup')!.style.display = '';
        document.getElementById('quiz-results')!.style.display = 'none';
        document.getElementById('quiz-active')!.style.display = 'none';
    });
}

async function startQuiz() {
    if (currentResults.length === 0) {
        // Try to load all questions if no filter applied
        const all = await getAllQuestions();
        currentResults = Object.values(all);
        if (currentResults.length === 0) {
            alert('No questions available. Browse GateOverflow first to collect questions, then apply filters.');
            return;
        }
    }

    const count = parseInt(
        (document.getElementById('quiz-count') as HTMLInputElement).value,
        10
    );
    const n = Math.min(count, currentResults.length);

    // Shuffle and pick N
    const shuffled = [...currentResults].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, n);

    currentQuiz = {
        id: Date.now().toString(),
        startedAt: Date.now(),
        questions: selected.map((q) => ({
            questionId: q.id,
            result: 'pending' as const,
        })),
        currentIndex: 0,
        isComplete: false,
    };

    await saveQuizSession(currentQuiz);
    showQuizQuestion();
}

function showQuizQuestion() {
    if (!currentQuiz) return;

    document.getElementById('quiz-setup')!.style.display = 'none';
    document.getElementById('quiz-results')!.style.display = 'none';
    document.getElementById('quiz-active')!.style.display = '';

    const total = currentQuiz.questions.length;
    const current = currentQuiz.currentIndex;

    // Progress
    const pct = ((current) / total) * 100;
    (document.getElementById('quiz-progress-fill') as HTMLElement).style.width = `${pct}%`;
    document.getElementById('quiz-progress-text')!.textContent = `${current + 1} / ${total}`;

    // Find question data
    const qId = currentQuiz.questions[current].questionId;
    const q = currentResults.find((r) => r.id === qId);

    if (q) {
        document.getElementById('quiz-q-title')!.textContent = q.title;
        document.getElementById('quiz-q-snippet')!.textContent = q.bodySnippet || '';
        (document.getElementById('quiz-q-link') as HTMLAnchorElement).href = q.url;

        const tagsEl = document.getElementById('quiz-q-tags')!;
        tagsEl.innerHTML = '';
        [...q.goTags.slice(0, 5), ...q.userData.customTags].forEach((t) => {
            const tag = document.createElement('span');
            tag.className = 'go-result-tag';
            tag.textContent = t;
            tagsEl.appendChild(tag);
        });
    } else {
        // Question data might not be in current results, fetch from storage
        getAllQuestions().then((all) => {
            const stored = all[qId];
            if (stored) {
                document.getElementById('quiz-q-title')!.textContent = stored.title;
                document.getElementById('quiz-q-snippet')!.textContent = stored.bodySnippet || '';
                (document.getElementById('quiz-q-link') as HTMLAnchorElement).href = stored.url;
            }
        });
    }
}

async function answerQuiz(result: 'correct' | 'wrong' | 'skipped') {
    if (!currentQuiz) return;

    currentQuiz.questions[currentQuiz.currentIndex].result = result;
    currentQuiz.currentIndex++;

    if (currentQuiz.currentIndex >= currentQuiz.questions.length) {
        currentQuiz.isComplete = true;
        await saveQuizSession(currentQuiz);
        showQuizResults();
    } else {
        await saveQuizSession(currentQuiz);
        showQuizQuestion();
    }
}

function showQuizResults() {
    if (!currentQuiz) return;

    document.getElementById('quiz-active')!.style.display = 'none';
    document.getElementById('quiz-results')!.style.display = '';

    const correct = currentQuiz.questions.filter((q) => q.result === 'correct').length;
    const wrong = currentQuiz.questions.filter((q) => q.result === 'wrong').length;
    const skipped = currentQuiz.questions.filter((q) => q.result === 'skipped').length;

    document.getElementById('stat-correct')!.textContent = String(correct);
    document.getElementById('stat-wrong')!.textContent = String(wrong);
    document.getElementById('stat-skipped')!.textContent = String(skipped);
}

// ══════════════════════════════════════════
//  Settings Panel
// ══════════════════════════════════════════

async function initSettingsPanel() {
    await renderSettingsTags();

    // Add tag
    document.getElementById('btn-add-tag')!.addEventListener('click', async () => {
        const input = document.getElementById('new-tag-input') as HTMLInputElement;
        const tag = input.value.trim().toLowerCase().replace(/\s+/g, '-');
        if (tag) {
            await addCustomTag(tag);
            input.value = '';
            await renderSettingsTags();
        }
    });

    document.getElementById('new-tag-input')!.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            document.getElementById('btn-add-tag')!.click();
        }
    });

    // Export
    document.getElementById('btn-export')!.addEventListener('click', async () => {
        const json = await exportAllData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gate-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showSettingsMessage('✅ Data exported successfully!');
    });

    // Import
    document.getElementById('btn-import')!.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
            const result = await importData(text);
            showSettingsMessage(`✅ Imported ${result.imported} questions!`);
            await updateStats();
        } catch (err) {
            showSettingsMessage(`❌ Import failed: ${err}`);
        }
    });

    // Clear
    document.getElementById('btn-clear-data')!.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear ALL stored data? This cannot be undone.')) {
            await clearAllData();
            showSettingsMessage('🗑️ All data cleared.');
            await updateStats();
            await renderSettingsTags();
        }
    });
}

async function renderSettingsTags() {
    const container = document.getElementById('settings-tags')!;
    container.innerHTML = '';
    const tags = await getCustomTags();

    tags.forEach((tag) => {
        const el = document.createElement('span');
        el.className = 'go-settings-tag';
        el.style.background = getTagColor(tag);
        el.textContent = tag;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'go-settings-tag-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', async () => {
            await removeCustomTag(tag);
            await renderSettingsTags();
        });

        el.appendChild(removeBtn);
        container.appendChild(el);
    });
}

function showSettingsMessage(msg: string) {
    const el = document.getElementById('settings-message')!;
    el.textContent = msg;
    setTimeout(() => {
        el.textContent = '';
    }, 4000);
}

// ══════════════════════════════════════════
//  Stats
// ══════════════════════════════════════════

async function updateStats() {
    const all = await getAllQuestions();
    const count = Object.keys(all).length;
    document.getElementById('total-count')!.textContent = `${count} Qs`;
}
