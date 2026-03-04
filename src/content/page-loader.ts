/**
 * Pagination loader — fetches ALL pages of questions and merges them
 * into the current page so the filter can work on everything at once.
 */

const LOADER_ID = 'go-page-loader';

/**
 * Get all pagination page URLs from the current page.
 */
function getPaginationUrls(): string[] {
    const links = document.querySelectorAll('.qa-page-links .qa-page-link');
    const urls = new Set<string>();

    links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        // Skip "next" / "prev" links — they duplicate page numbers
        if (
            link.classList.contains('qa-page-next') ||
            link.classList.contains('qa-page-prev')
        ) {
            return;
        }
        if (href) urls.add(href);
    });

    return Array.from(urls);
}

/**
 * Fetch a page and extract question list items from its HTML.
 */
async function fetchPageQuestions(url: string): Promise<string[]> {
    try {
        const resp = await fetch(url);
        const html = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const items = doc.querySelectorAll('.qa-q-list-item');
        return Array.from(items).map((item) => item.outerHTML);
    } catch (e) {
        console.warn(`[GO Enhancer] Failed to fetch page: ${url}`, e);
        return [];
    }
}

/**
 * Inject a "Load All Pages" button into the filter panel.
 * When clicked, fetches all pagination pages and appends their questions
 * to the current page's question list.
 */
export function injectPageLoader() {
    const paginationUrls = getPaginationUrls();
    if (paginationUrls.length === 0) return; // Only 1 page, nothing to load

    // Find the filter panel actions area or create a standalone button
    const filterActions = document.querySelector('.go-fp-actions');
    const questionList = document.querySelector('.qa-q-list') ||
        document.querySelector('.qa-q-list-item')?.parentElement;

    if (!questionList) return;

    // Create the load-all button
    const container = document.createElement('div');
    container.id = LOADER_ID;
    container.className = 'go-loader-section';
    container.innerHTML = `
    <button id="go-load-all-btn" class="go-fp-btn go-fp-btn--primary go-loader-btn">
      📄 Load All ${paginationUrls.length + 1} Pages
    </button>
    <div id="go-load-progress" class="go-loader-progress" style="display:none">
      <div class="go-loader-bar">
        <div id="go-load-fill" class="go-loader-fill"></div>
      </div>
      <span id="go-load-status" class="go-loader-status">Loading…</span>
    </div>
  `;

    // Insert into filter panel body if it exists, otherwise before pagination
    const fpBody = document.getElementById('go-fp-body');
    if (fpBody) {
        const section = document.createElement('div');
        section.className = 'go-fp-section';
        section.appendChild(container);
        // Insert before the actions buttons
        if (filterActions) {
            filterActions.parentNode?.insertBefore(section, filterActions);
        } else {
            fpBody.appendChild(section);
        }
    } else {
        const pagination = document.querySelector('.qa-page-links');
        pagination?.parentNode?.insertBefore(container, pagination);
    }

    // Handle click
    const loadBtn = document.getElementById('go-load-all-btn')!;
    const progressEl = document.getElementById('go-load-progress')!;
    const fillEl = document.getElementById('go-load-fill')!;
    const statusEl = document.getElementById('go-load-status')!;

    loadBtn.addEventListener('click', async () => {
        loadBtn.disabled = true;
        loadBtn.textContent = '⏳ Loading…';
        progressEl.style.display = 'flex';

        const total = paginationUrls.length;
        let loaded = 0;
        let totalNewQuestions = 0;

        for (const url of paginationUrls) {
            statusEl.textContent = `Loading page ${loaded + 1} of ${total}…`;
            fillEl.style.width = `${((loaded) / total) * 100}%`;

            const questionsHtml = await fetchPageQuestions(url);
            totalNewQuestions += questionsHtml.length;

            // Append to current page's question list
            questionsHtml.forEach((html) => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = html;
                const item = wrapper.firstElementChild;
                if (item) {
                    questionList.appendChild(item);
                }
            });

            loaded++;
            // Small delay to avoid hammering the server
            await new Promise((r) => setTimeout(r, 300));
        }

        fillEl.style.width = '100%';
        statusEl.textContent = `✅ Loaded ${totalNewQuestions} questions from ${total} pages`;
        loadBtn.textContent = '✅ All Pages Loaded';
        loadBtn.disabled = true;

        // Hide original pagination since all questions are now on one page
        const pagination = document.querySelector('.qa-page-links');
        if (pagination) (pagination as HTMLElement).style.display = 'none';

        // Re-run the content script to parse and inject UI for new questions
        // Dispatch a custom event that index.ts can listen for
        window.dispatchEvent(new CustomEvent('go-pages-loaded'));
    });
}
