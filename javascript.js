(async APILoader => {
    const retryCreateAPI = async (retries, delay) => {
        try {
            const API = await APILoader.create();
            return API; // Successfully created API
        } catch (error) {
            if (retries === 0) {
                console.error('Dealer.com API not available after multiple attempts:', error);
                window.location.reload();
                throw new Error('Dealer.com API not available, refreshing page...');
            }
            console.warn(`Dealer.com API not available, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryCreateAPI(retries - 1, delay * 2); // Retry with exponential backoff
        }
    };

    // Cache to store fetched data for each sheet
    const sheetdbCache = {};

    const fetchSheetData = async (sheetdbUrl, sheetdbSheet) => {
        // If the data is already cached, return it
        if (sheetdbCache[sheetdbSheet]) {
            return sheetdbCache[sheetdbSheet];
        }

        // Fetch data from the SheetDB API for the given sheet
        try {
            const sheetdbRequestUrl = `${sheetdbUrl}?sheet=${encodeURIComponent(sheetdbSheet)}`;
            const response = await fetch(sheetdbRequestUrl);
            const data = await response.json();

            // Cache the data to avoid duplicate API calls
            sheetdbCache[sheetdbSheet] = data;
            return data;
        } catch (error) {
            console.error(`Error fetching data for sheet: ${sheetdbSheet}`, error);
            return null;
        }
    };

    const updateElementContent = (element, data, make, model) => {
        // Find the relevant entry based on Make and Model
        const matchingEntry = data.find(item => item.Make === make && item.Model === model);

        if (matchingEntry) {
            // Replace placeholders based on the response data
            const keys = Object.keys(matchingEntry);
            keys.forEach(key => {
                const placeholder = `{{${key}}}`;
                if (element.innerHTML.includes(placeholder)) {
                    element.innerHTML = element.innerHTML.replace(placeholder, matchingEntry[key]);
                }
            });

            // If there are still placeholders not replaced, set them to an empty string
            element.innerHTML = element.innerHTML.replace(/{{\w+}}/g, '');

            // Apply CSS to prevent text from being cut off on desktop
            element.style.whiteSpace = 'nowrap';
            element.style.wordBreak = 'keep-all';
            element.style.overflowWrap = 'normal';

            console.log(`Updated element content for ${make} ${model}: ${element.innerHTML}`);
        } else {
            // No matching data found, remove all placeholders and set to blank
            element.innerHTML = element.innerHTML.replace(/{{\w+}}/g, '');
            console.log(`No matching data found for ${make} ${model}, setting placeholders to blank.`);
        }
    };

    const loadStaticContent = async (element, pageId, API) => {
        try {
            // Normalize the page ID by removing the "elementor-" prefix if present
            const normalizedPageId = pageId.replace(/^elementor-/, '');
            const response = await fetch(`https://digitalteamass.wpenginepowered.com/wp-json/elementor/v1/static-content/${normalizedPageId}`);
            const data = await response.json();

            if (data && data.content) {
                // Create a shadow root for isolation
                const shadowRoot = element.attachShadow({ mode: 'open' });

                // Insert the static HTML content into the shadow root
                const contentContainer = document.createElement('div');
                contentContainer.innerHTML = data.content;
                shadowRoot.appendChild(contentContainer);

                // Apply scoped CSS and JS to the shadow root
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

                // Add custom styles to prevent horizontal scrolling and override problematic styles
                const styleElement = document.createElement('style');
                styleElement.innerHTML = `
                    /* Prevent horizontal scrolling */
                    body, html {
                        overflow-x: hidden !important;
                    }
                    /* Ensure the container does not cause overflow */
                    .container-max-md.page-section.p-4.p-md-5.px-lg-6.px-xl-8 {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    /* Desktop-specific text handling */
                    [data-sheetdb-url] {
                        white-space: nowrap;
                        word-break: keep-all;
                        overflow-wrap: normal;
                    }
                    @media (max-width: 768px) {
                        /* Revert styles for mobile */
                        [data-sheetdb-url] {
                            white-space: normal;
                            word-break: break-word;
                            overflow-wrap: break-word;
                        }
                    }
                `;
                document.head.appendChild(styleElement); // Add the styles to the main document

                // Hide the loading spinner and hidden content container in the main document
                const loadingContainer = document.querySelector('.loading-container');
                const hiddenContentContainer = document.querySelector('.hidden-content-container');
                if (loadingContainer) loadingContainer.style.display = 'none';
                if (hiddenContentContainer) hiddenContentContainer.style.display = 'none';

                // Manually trigger a SheetDB update for each element inside the shadow root
                console.log('Manually triggering SheetDB update for elements inside the shadow root...');
                const sheetdbElements = shadowRoot.querySelectorAll('[data-sheetdb-url]');
                for (const el of sheetdbElements) {
                    const sheetdbUrl = el.getAttribute('data-sheetdb-url');
                    const sheetdbSheet = el.getAttribute('data-sheetdb-sheet');
                    const sheetdbSearch = el.getAttribute('data-sheetdb-search');

                    if (sheetdbUrl && sheetdbSheet && sheetdbSearch) {
                        // Parse the search parameters to extract Make and Model
                        const searchParams = new URLSearchParams(sheetdbSearch);
                        const make = searchParams.get('Make');
                        const model = searchParams.get('Model');

                        if (make && model) {
                            // Fetch data for the given sheet
                            const sheetData = await fetchSheetData(sheetdbUrl, sheetdbSheet);

                            if (sheetData) {
                                // Update the content of the element based on the retrieved data
                                updateElementContent(el, sheetData, make, model);
                            }
                        }

                        // If no data was found, ensure placeholders are removed
                        if (el.innerHTML.includes('{{')) {
                            el.innerHTML = ''; // Set the content to an empty string
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
        // Force a redownload of all content by calling sheetdb_upd() with console log debugging
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

    // Make the updateContent function available globally
    window.updateContent = updateContent;

    // Display the loading spinner and hidden content container on page load
    const hiddenContentContainer = document.querySelector('.hidden-content-container');
    if (hiddenContentContainer) hiddenContentContainer.style.display = 'block';
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) loadingContainer.style.display = 'block';

    const API = await retryCreateAPI(5, 1000);

    API.subscribe('page-load-v1', ev => {
        const elementorDivs = document.querySelectorAll('[data-elementor-id]');

        elementorDivs.forEach(elementorDiv => {
            const pageId = elementorDiv.getAttribute('data-elementor-id');
            if (pageId) {
                loadStaticContent(elementorDiv, pageId, API);
            }
        });
    });

})(window.DDC.APILoader);
