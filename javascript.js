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
                `;
                document.head.appendChild(styleElement); // Add the styles to the main document

                // Hide the loading spinner and hidden content container in the main document
                const loadingContainer = document.querySelector('.loading-container');
                const hiddenContentContainer = document.querySelector('.hidden-content-container');
                if (loadingContainer) loadingContainer.style.display = 'none';
                if (hiddenContentContainer) hiddenContentContainer.style.display = 'none';

                // Manually trigger a SheetDB update for elements inside the shadow root
                console.log('Manually triggering SheetDB update for elements inside the shadow root...');
                const sheetdbElements = shadowRoot.querySelectorAll('[data-sheetdb-url]');
                sheetdbElements.forEach(async el => {
                    console.log('Updating element:', el);
                    const sheetdbUrl = el.getAttribute('data-sheetdb-url');
                    const sheetdbSheet = el.getAttribute('data-sheetdb-sheet');
                    const sheetdbSearch = el.getAttribute('data-sheetdb-search');

                    if (sheetdbUrl) {
                        try {
                            const sheetdbResponse = await fetch(`${sheetdbUrl}?sheet=${sheetdbSheet}&search=${sheetdbSearch}`);
                            const sheetdbData = await sheetdbResponse.json();
                            
                            if (sheetdbData.length > 0) {
                                const keys = Object.keys(sheetdbData[0]);
                                keys.forEach(key => {
                                    const placeholder = `{{${key}}}`;
                                    if (el.innerHTML.includes(placeholder)) {
                                        el.innerHTML = el.innerHTML.replace(placeholder, sheetdbData[0][key]);
                                    }
                                });
                                console.log(`Updated element content with SheetDB data: ${el.innerHTML}`);
                            } else {
                                console.log('No data found for the given SheetDB parameters.');
                            }
                        } catch (error) {
                            console.error('Error fetching SheetDB data:', error);
                        }
                    }
                });
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
