import { StoredQuestion, UserQuestionData } from '../shared/types';
import { getQuestion, updateUserData, getCustomTags, addCustomTag } from '../shared/storage';
import { getTagColor } from '../shared/constants';

const INJECTED_ATTR = 'data-go-enhanced';

/**
 * Inject tagging UI into question list items.
 */
export async function injectListUI(questions: StoredQuestion[]): Promise<void> {
    const items = document.querySelectorAll('.qa-q-list-item');

    for (const item of Array.from(items)) {
        if (item.hasAttribute(INJECTED_ATTR)) continue;
        item.setAttribute(INJECTED_ATTR, 'true');

        const titleEl = item.querySelector('.qa-q-item-title a') as HTMLAnchorElement | null;
        if (!titleEl) continue;

        const url = titleEl.href;
        const idMatch = url.match(/gateoverflow\.in\/(\d+)/);
        if (!idMatch) continue;
        const id = idMatch[1];

        // Find matching parsed question or fetch from storage
        let stored = questions.find((q) => q.id === id) || null;
        const existingStored = await getQuestion(id);
        if (existingStored) {
            stored = existingStored;
        }

        // Create toolbar container
        const toolbar = document.createElement('div');
        toolbar.className = 'go-enhance-toolbar';

        // 1. Mark type toggle
        const markBtn = createMarkTypeButton(id, stored?.userData.markType || null);
        toolbar.appendChild(markBtn);

        // 2. Difficulty stars
        const starsContainer = createDifficultyStars(id, stored?.userData.difficulty || 0);
        toolbar.appendChild(starsContainer);

        // 3. Custom tag chips
        const tagBar = await createTagBar(id, stored?.userData.customTags || []);
        toolbar.appendChild(tagBar);

        // Insert toolbar after the tags row
        const tagsRow = item.querySelector('.qa-q-item-tag-list') || item.querySelector('.qa-q-item-content');
        if (tagsRow) {
            tagsRow.parentNode?.insertBefore(toolbar, tagsRow.nextSibling);
        } else {
            item.appendChild(toolbar);
        }
    }
}

/**
 * Inject tagging UI on a question detail page.
 */
export async function injectDetailUI(question: StoredQuestion | null): Promise<void> {
    const qView = document.querySelector('.qa-q-view');
    if (!qView || qView.hasAttribute(INJECTED_ATTR)) return;
    qView.setAttribute(INJECTED_ATTR, 'true');

    if (!question) return;

    const existingStored = await getQuestion(question.id);
    if (existingStored) {
        question = existingStored;
    }

    const toolbar = document.createElement('div');
    toolbar.className = 'go-enhance-toolbar go-enhance-toolbar--detail';

    // Mark type
    const markBtn = createMarkTypeButton(question.id, question.userData.markType);
    toolbar.appendChild(markBtn);

    // Priority
    const priorityBtn = createPriorityButton(question.id, question.userData.priority);
    toolbar.appendChild(priorityBtn);

    // Difficulty stars
    const starsContainer = createDifficultyStars(question.id, question.userData.difficulty);
    toolbar.appendChild(starsContainer);

    // Custom tags
    const tagBar = await createTagBar(question.id, question.userData.customTags);
    toolbar.appendChild(tagBar);

    // Insert after tag list
    const tagList = qView.querySelector('.qa-q-view-tags') || qView.querySelector('.qa-q-view-content');
    if (tagList) {
        tagList.parentNode?.insertBefore(toolbar, tagList.nextSibling);
    } else {
        qView.appendChild(toolbar);
    }
}

// ── UI Component Builders ──

function createMarkTypeButton(
    questionId: string,
    current: '1-mark' | '2-mark' | null
): HTMLElement {
    const container = document.createElement('div');
    container.className = 'go-mark-toggle';

    const btn1 = document.createElement('button');
    btn1.textContent = '1M';
    btn1.title = '1-mark question';
    btn1.className = `go-mark-btn${current === '1-mark' ? ' go-mark-btn--active' : ''}`;

    const btn2 = document.createElement('button');
    btn2.textContent = '2M';
    btn2.title = '2-mark question';
    btn2.className = `go-mark-btn${current === '2-mark' ? ' go-mark-btn--active' : ''}`;

    btn1.addEventListener('click', async (e) => {
        e.stopPropagation();
        const newVal = btn1.classList.contains('go-mark-btn--active') ? null : '1-mark';
        await updateUserData(questionId, { markType: newVal as any });
        btn1.classList.toggle('go-mark-btn--active', newVal === '1-mark');
        btn2.classList.remove('go-mark-btn--active');
    });

    btn2.addEventListener('click', async (e) => {
        e.stopPropagation();
        const newVal = btn2.classList.contains('go-mark-btn--active') ? null : '2-mark';
        await updateUserData(questionId, { markType: newVal as any });
        btn2.classList.toggle('go-mark-btn--active', newVal === '2-mark');
        btn1.classList.remove('go-mark-btn--active');
    });

    container.appendChild(btn1);
    container.appendChild(btn2);
    return container;
}

function createPriorityButton(
    questionId: string,
    current: 'low' | 'medium' | 'high' | null
): HTMLElement {
    const container = document.createElement('div');
    container.className = 'go-priority-select';

    const select = document.createElement('select');
    select.title = 'Set priority';
    select.className = 'go-priority-dropdown';

    const options: Array<{ value: string; label: string }> = [
        { value: '', label: '⚡ Priority' },
        { value: 'low', label: '🟢 Low' },
        { value: 'medium', label: '🟡 Medium' },
        { value: 'high', label: '🔴 High' },
    ];

    options.forEach(({ value, label }) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (value === (current || '')) opt.selected = true;
        select.appendChild(opt);
    });

    select.addEventListener('change', async () => {
        const val = select.value || null;
        await updateUserData(questionId, { priority: val as any });
    });

    container.appendChild(select);
    return container;
}

function createDifficultyStars(questionId: string, current: number): HTMLElement {
    const container = document.createElement('div');
    container.className = 'go-difficulty-stars';
    container.title = 'Rate difficulty';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = `go-star${i <= current ? ' go-star--filled' : ''}`;
        star.textContent = '★';
        star.dataset.rating = String(i);

        star.addEventListener('click', async (e) => {
            e.stopPropagation();
            const rating = parseInt(star.dataset.rating!, 10);
            // If clicking the same rating, toggle off
            const currentRating =
                container.querySelectorAll('.go-star--filled').length;
            const newRating = rating === currentRating ? 0 : rating;

            await updateUserData(questionId, { difficulty: newRating });

            // Update stars visually
            container.querySelectorAll('.go-star').forEach((s, idx) => {
                (s as HTMLElement).classList.toggle('go-star--filled', idx < newRating);
            });
        });

        star.addEventListener('mouseenter', () => {
            const hoverRating = parseInt(star.dataset.rating!, 10);
            container.querySelectorAll('.go-star').forEach((s, idx) => {
                (s as HTMLElement).classList.toggle('go-star--hover', idx < hoverRating);
            });
        });

        star.addEventListener('mouseleave', () => {
            container.querySelectorAll('.go-star').forEach((s) => {
                (s as HTMLElement).classList.remove('go-star--hover');
            });
        });

        container.appendChild(star);
    }

    return container;
}

async function createTagBar(
    questionId: string,
    currentTags: string[]
): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.className = 'go-custom-tags';

    const allTags = await getCustomTags();

    // Render existing tags as chips
    const renderChips = () => {
        // Clear existing chips (keep the add button)
        container.querySelectorAll('.go-tag-chip').forEach((c) => c.remove());

        currentTags.forEach((tag) => {
            const chip = document.createElement('span');
            chip.className = 'go-tag-chip';
            chip.style.setProperty('--tag-color', getTagColor(tag));
            chip.textContent = tag;

            const removeBtn = document.createElement('span');
            removeBtn.className = 'go-tag-chip-remove';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                currentTags = currentTags.filter((t) => t !== tag);
                await updateUserData(questionId, { customTags: currentTags });
                renderChips();
            });

            chip.appendChild(removeBtn);
            container.insertBefore(chip, container.querySelector('.go-tag-add'));
        });
    };

    // Add tag button
    const addBtn = document.createElement('button');
    addBtn.className = 'go-tag-add';
    addBtn.textContent = '+ Tag';
    addBtn.title = 'Add a custom tag';

    // Dropdown for adding tags
    const dropdown = document.createElement('div');
    dropdown.className = 'go-tag-dropdown';
    dropdown.style.display = 'none';

    const refreshDropdown = () => {
        dropdown.innerHTML = '';
        const available = allTags.filter((t) => !currentTags.includes(t));

        available.forEach((tag) => {
            const item = document.createElement('div');
            item.className = 'go-tag-dropdown-item';
            item.textContent = tag;
            item.style.setProperty('--tag-color', getTagColor(tag));
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                currentTags.push(tag);
                await updateUserData(questionId, { customTags: currentTags });
                renderChips();
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(item);
        });

        // Custom input to add a new tag
        const customInput = document.createElement('input');
        customInput.className = 'go-tag-custom-input';
        customInput.placeholder = 'New tag…';
        customInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const val = customInput.value.trim().toLowerCase().replace(/\s+/g, '-');
                if (val && !currentTags.includes(val)) {
                    await addCustomTag(val);
                    currentTags.push(val);
                    await updateUserData(questionId, { customTags: currentTags });
                    allTags.push(val);
                    renderChips();
                    dropdown.style.display = 'none';
                }
            }
        });
        customInput.addEventListener('click', (e) => e.stopPropagation());
        dropdown.appendChild(customInput);
    };

    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display !== 'none';
        dropdown.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) refreshDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });

    container.appendChild(addBtn);
    container.appendChild(dropdown);
    renderChips();

    return container;
}
