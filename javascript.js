(async APILoader => {
    const maxRetries = 3;
    const retryCreateAPI = async (retries, delay) => {
        try {
            const API = await APILoader.create();
            return API;
        } catch (error) {
            if (retries === 0) {
                console.error('Dealer.com API not available after multiple attempts:', error);
                updateLoadingIframe();
                return null;
            }
            console.warn(`Dealer.com API not available, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryCreateAPI(retries - 1, delay * 2);
        }
    };

    const updateLoadingIframe = () => {
        const loadingIframe = document.querySelector('.loading-container .loading-iframe');
        if (loadingIframe) {
            loadingIframe.src = 'https://gmg-digital.vercel.app/longer-than-expected';
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    };

    const sheetdbCache = {};

    const fetchSheetData = async (sheetdbUrl, sheetdbSheet) => {
        if (sheetdbCache[sheetdbSheet]) {
            return sheetdbCache[sheetdbSheet];
        }
        try {
            const sheetdbRequestUrl = `${sheetdbUrl}?sheet=${encodeURIComponent(sheetdbSheet)}`;
            const response = await fetch(sheetdbRequestUrl);
            const data = await response.json();
            sheetdbCache[sheetdbSheet] = data;
            return data;
        } catch (error) {
            console.error(`Error fetching data for sheet: ${sheetdbSheet}`, error);
            return null;
        }
    };

    const updateElementContent = (element, data, make, model) => {
        const matchingEntry = data.find(
            item => item.Make === make && item.Model === model && item.Expired === 'Active' && item.Status === 'Enabled'
        );

        if (matchingEntry) {
            const keys = Object.keys(matchingEntry);
            keys.forEach(key => {
                const placeholder = `{{${key}}}`;
                if (element.innerHTML.includes(placeholder)) {
                    element.innerHTML = element.innerHTML.replace(placeholder, matchingEntry[key]);
                }
            });

            // Handle Disclaimer specifically
            const disclaimerPlaceholder = '{{Disclaimer}}';
            if (matchingEntry.Disclaimer) {
                element.innerHTML = element.innerHTML.replace(disclaimerPlaceholder, matchingEntry.Disclaimer);
            } else {
                element.innerHTML = element.innerHTML.replace(disclaimerPlaceholder, '');
                console.log('Disclaimer placeholder removed due to missing content.');
            }

            element.innerHTML = element.innerHTML.replace(/{{\w+}}/g, '');

            element.style.whiteSpace = 'normal';
            element.style.wordBreak = 'keep-all';
            element.style.overflowWrap = 'break-word';

            const styleElement = document.createElement('style');
            styleElement.innerHTML = `
                @media (min-width: 769px) {
                    [data-sheetdb-url] {
                        white-space: normal;
                        word-break: keep-all;
                        overflow-wrap: break-word;
                    }
                }
            `;
            document.head.appendChild(styleElement);

            console.log(`Updated element content for ${make} ${model}: ${element.innerHTML}`);
        } else {
            element.innerHTML = element.innerHTML.replace(/{{\w+}}/g, '');
            console.log(`No matching data found for ${make} ${model}, setting placeholders to blank.`);
        }
    };

    const loadStaticContent = async (element, pageId, API) => {
        try {
            const normalizedPageId = pageId.replace(/^elementor-/, '');
            const response = await fetch(`https://digitalteamass.wpenginepowered.com/wp-json/elementor/v1/static-content/${normalizedPageId}`);
            const data = await response.json();

            if (data && data.content) {
                const shadowRoot = element.attachShadow({ mode: 'open' });

                const contentContainer = document.createElement('div');
                contentContainer.innerHTML = data.content;
                shadowRoot.appendChild(contentContainer);

                if (data.styles) {
                    data.styles.forEach(styleUrl => {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = styleUrl;
                        shadowRoot.appendChild(link);
                    });
                }

                if (data.scripts) {
                    data.scripts.forEach(scriptUrl => {
                        const script = document.createElement('script');
                        script.src = scriptUrl;
                        shadowRoot.appendChild(script);
                    });
                }

                const styleElement = document.createElement('style');
                styleElement.innerHTML = `
                    body, html {
                        overflow-x: hidden !important;
                    }
                    .container-max-md.page-section.p-4.p-md-5.px-lg-6.px-xl-8 {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }
                `;
                document.head.appendChild(styleElement);

                const loadingContainer = document.querySelector('.loading-container');
                const hiddenContentContainer = document.querySelector('.hidden-content-container');
                if (loadingContainer) loadingContainer.style.display = 'none';
                if (hiddenContentContainer) hiddenContentContainer.style.display = 'none';

                console.log('Manually triggering SheetDB update for elements inside the shadow root...');
                const sheetdbElements = shadowRoot.querySelectorAll('[data-sheetdb-url]');
                for (const el of sheetdbElements) {
                    const sheetdbUrl = el.getAttribute('data-sheetdb-url');
                    const sheetdbSheet = el.getAttribute('data-sheetdb-sheet');
                    const sheetdbSearch = el.getAttribute('data-sheetdb-search');

                    if (sheetdbUrl && sheetdbSheet && sheetdbSearch) {
                        const searchParams = new URLSearchParams(sheetdbSearch);
                        const make = searchParams.get('Make');
                        const model = searchParams.get('Model');

                        if (make && model) {
                            const sheetData = await fetchSheetData(sheetdbUrl, sheetdbSheet);

                            if (sheetData) {
                                updateElementContent(el, sheetData, make, model);
                            }
                        }

                        if (el.innerHTML.includes('{{')) {
                            el.innerHTML = '';
                            console.log(`Removed placeholders for element: ${el.outerHTML}`);
                        }
                    } else {
                        console.warn('Missing data-sheetdb-url, data-sheetdb-sheet, or data-sheetdb-search attribute for element:', el);
                    }
                }
            } else {
                console.error(`No content found for page ID ${normalizedPageId}`);
            }
        } catch (error) {
            console.error('Error loading static content:', error);
        }
    };

    const updateContent = () => {
        if (typeof window.sheetdb_upd === 'function') {
            console.log('Triggering content update via sheetdb_upd()...');
            try {
                window.sheetdb_upd();
                console.log('Content update triggered successfully.');
            } catch (error) {
                console.error('Error triggering content update via sheetdb_upd():', error);
            }
        } else {
            console.error('sheetdb_upd() function is not available.');
        }
    };

    window.updateContent = updateContent;

    const hiddenContentContainer = document.querySelector('.hidden-content-container');
    if (hiddenContentContainer) hiddenContentContainer.style.display = 'block';
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) loadingContainer.style.display = 'block';

    const API = await retryCreateAPI(maxRetries, 1000);

    if (API) {
        API.subscribe('page-load-v1', ev => {
            const elementorDivs = document.querySelectorAll('[data-elementor-id]');

            elementorDivs.forEach(elementorDiv => {
                const pageId = elementorDiv.getAttribute('data-elementor-id');
                if (pageId) {
                    loadStaticContent(elementorDiv, pageId, API);
                }
            });
        });
    }
})(window.DDC.APILoader);
