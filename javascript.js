(async APILoader => {
    const maxRetries = 2;

    const retryCreateAPI = async (retries, delay) => {
        try {
            console.log(`Attempting to create DDC API. Retries left: ${retries}`);
            const API = await APILoader.create();
            console.log('DDC API created successfully.');
            return API;
        } catch (error) {
            if (retries === 0) {
                console.error('Dealer.com API not available after multiple attempts:', error);
                loadContentWithoutAPI(); // Fallback to direct content load
                return null;
            }
            console.warn(`DDC API creation failed. Retrying in ${delay}ms... Retries left: ${retries - 1}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryCreateAPI(retries - 1, delay * 2);
        }
    };

    const loadContentWithoutAPI = () => {
        console.log("Fallback mode activated: loading content directly without DDC API.");
        const elementorDivs = document.querySelectorAll('[data-elementor-id]');
        
        elementorDivs.forEach(elementorDiv => {
            const pageId = elementorDiv.getAttribute('data-elementor-id');
            if (pageId) {
                console.log(`Loading content for element with page ID: ${pageId} using fallback.`);
                loadStaticContentDirectly(elementorDiv, pageId);
            }
        });
    };

    const updateLoadingIframe = () => {
        console.log("Updating loading iframe to 'longer-than-expected' message.");
        const loadingIframe = document.querySelector('.loading-container .loading-iframe');
        if (loadingIframe) {
            loadingIframe.src = 'https://gmg-digital.vercel.app/longer-than-expected';
            setTimeout(() => {
                console.log("Reloading page after delay.");
                window.location.reload();
            }, 3000);
        }
    };

const loadScriptAfterContent = (scriptUrl, callback) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
        console.log(`Script loaded: ${scriptUrl}`);
        if (callback) callback();
    };
    script.onerror = () => {
        console.error(`Failed to load script: ${scriptUrl}`);
    };
    document.head.appendChild(script);
};

    
const loadEmbedSocialScript = () => {
    loadScriptAfterContent('https://assets.garberauto.com/assets/js/embedSocial.js', () => {
        if (typeof initializeEmbedSocial === 'function') {
            console.log('Initializing EmbedSocial after script load...');
            initializeEmbedSocial();
        } else {
            console.error('initializeEmbedSocial function is not available. Ensure the script is properly loaded.');
        }
    });
};

const loadAccordionInitializationScript = () => {
    loadScriptAfterContent('https://assets.garberauto.com/assets/js/initializeAccordion.js', () => {
        if (typeof initializeAccordion === 'function') {
            console.log('Initializing Accordion after script load...');
            
            // Select all elements with the class "elementor-content"
            const shadowHosts = document.querySelectorAll('.elementor-content');
            shadowHosts.forEach((shadowHost) => {
                initializeAccordion(shadowHost);
            });
        } else {
            console.error('initializeAccordion function is not available. Ensure the script is properly loaded.');
        }
    });
};

const loadMobileMenuFixScript = () => {
    loadScriptAfterContent('https://assets.garberauto.com/assets/js/mobileMenuFixScript.js', () => {
        if (typeof initializeMobileMenuFixScript === 'function') {
            console.log('Initializing Mobile Menu Fix Script after script load...');
            initializeMobileMenuFixScript();
        } else {
            console.error('initializeMobileMenuFixScript function is not available. Ensure the script is properly loaded.');
        }
    });
};

    const loadAnchorLinkFixScript = () => {
    loadScriptAfterContent('https://assets.garberauto.com/assets/js/anchorLinkFix.js', () => {
        if (typeof initializeAnchorLinkFix === 'function') {
            console.log('Initializing Anchor Link Fix after script load...');
            initializeAnchorLinkFix();
        } else {
            console.error('initializeAnchorLinkFix function is not available. Ensure the script is properly loaded.');
        }
    });
};
    const loadEVModelInfoRequestPopupScript = () => {
    loadScriptAfterContent('https://assets.garberauto.com/assets/js/evModelInfoRequestPopup.js', () => {
        if (typeof initializePopupDialog === 'function') {
            console.log('Initializing EV Model Info Request Popup Script after script load...');
            initializePopupDialog();
        } else {
            console.error('initializePopupDialog function is not available. Ensure the script is properly loaded.');
        }
    });
};

    const loadYouTubeVideoFixScript = () => {
    loadScriptAfterContent('https://assets.garberauto.com/assets/js/youtubeVideoFix.js', () => {
        if (typeof initializeYouTubeVideoFix === 'function') {
            console.log('Initializing YouTube Video Fix Script after script load...');
            initializeYouTubeVideoFix();
        } else {
            console.error('initializeYouTubeVideoFix function is not available. Ensure the script is properly loaded.');
        }
    });
};

    
    const sheetdbCache = {};

    const fetchSheetData = async (sheetdbUrl, sheetdbSheet) => {
        console.log(`Fetching data from SheetDB. Sheet: ${sheetdbSheet}`);
        if (sheetdbCache[sheetdbSheet]) {
            console.log(`Cache hit for sheet: ${sheetdbSheet}`);
            return sheetdbCache[sheetdbSheet];
        }
        try {
            const sheetdbRequestUrl = `${sheetdbUrl}?sheet=${encodeURIComponent(sheetdbSheet)}`;
            const response = await fetch(sheetdbRequestUrl);
            const data = await response.json();
            sheetdbCache[sheetdbSheet] = data;
            console.log(`Data fetched successfully from SheetDB for sheet: ${sheetdbSheet}`);
            return data;
        } catch (error) {
            console.error(`Error fetching data for sheet: ${sheetdbSheet}`, error);
            return null;
        }
    };

    const updateElementContent = (element, data, make, model) => {
        console.log(`Updating content for element based on make: ${make}, model: ${model}`);
        const matchingEntry = data.find(
            item => item.Make === make && item.Model === model && item.Expired === 'Active' && item.Status === 'Enabled'
        );

        if (matchingEntry) {
            console.log(`Matching entry found for ${make} ${model}:`, matchingEntry);
            const keys = Object.keys(matchingEntry);
            keys.forEach(key => {
                const placeholder = `{{${key}}}`;
                if (element.innerHTML.includes(placeholder)) {
                    console.log(`Replacing placeholder ${placeholder} with value: ${matchingEntry[key]}`);
                    element.innerHTML = element.innerHTML.replace(placeholder, matchingEntry[key]);
                }
            });

            const disclaimerPlaceholder = '{{Disclaimer}}';
            if (matchingEntry.Disclaimer) {
                console.log(`Replacing Disclaimer placeholder with value: ${matchingEntry.Disclaimer}`);
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
            console.log(`Style injected for responsive layout adjustments.`);
        } else {
            console.warn(`No matching entry found for ${make} ${model}. Clearing placeholders.`);
            element.innerHTML = element.innerHTML.replace(/{{\w+}}/g, '');
        }
    };

const webhookUrl = 'https://hook.us1.make.com/j0bg5rqky1jljb6qdo7l87ihoterb5of'; 

const sendErrorToWebhook = async (errorDetails) => {
    try {
        console.log('Sending error details to webhook...', errorDetails);
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorDetails),
        });
        console.log('Error details sent to webhook successfully.');
    } catch (webhookError) {
        console.error('Failed to send error details to webhook:', webhookError);
    }
};

const displayErrorWidget = () => {
    console.log('Displaying error widget iframe.');

    // Select the loading-container and hidden-content-container elements by class
    const loadingContainer = document.querySelector('.loading-container');
    const hiddenContentContainer = document.querySelector('.hidden-content-container');

    // Hide the hidden-content-container if it exists
    if (hiddenContentContainer) hiddenContentContainer.style.display = 'none';

    if (loadingContainer) {
        // Ensure the loading-container retains its position and dimensions
        loadingContainer.style.position = 'relative'; // Keep it positioned relative to its parent
        loadingContainer.style.width = '100%'; // Inherit width from its container
        loadingContainer.style.height = '100%'; // Inherit height from its container
        loadingContainer.style.display = 'block'; // Ensure it's visible
        loadingContainer.style.padding = '0';
        loadingContainer.style.margin = '0';
        loadingContainer.style.overflow = 'hidden'; // Prevent any overflow
        loadingContainer.style.backgroundColor = '#fff'; // Optional: white background

        // Create the iframe for the error widget
        const iframe = document.createElement('iframe');
        iframe.src = 'https://gmg-digital.vercel.app/widgets/error';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.display = 'block';

        // Clear existing content and append the iframe
        loadingContainer.innerHTML = ''; // Clear existing content
        loadingContainer.appendChild(iframe);

        console.log('Error widget iframe successfully added to loading-container.');
    } else {
        console.error('loading-container not found. Ensure it exists with the correct class name.');
    }
};

const loadStaticContent = async (element, pageId, API) => {
    try {
        console.log(`Loading static content for page ID: ${pageId}`);
        const normalizedPageId = pageId.replace(/^elementor-/, '');
        const response = await fetch(`https://digitalteamass.wpenginepowered.com/wp-json/elementor/v1/static-content/${normalizedPageId}`);
        const data = await response.json();

        // Handle errors in the response
        if (response.status === 404) {
            const errorDetails = {
                error: data.message || 'Page not found',
                status: response.status,
                pageId: pageId,
                pageUrl: window.location.href,
                timestamp: new Date().toISOString(),
            };
            console.error('404 Error: Static content not found.', errorDetails);

            // Send error details to webhook
            await sendErrorToWebhook(errorDetails);

            // Display error widget
            displayErrorWidget();
            return;
        } else if (response.status !== 200) {
            const errorDetails = {
                error: data.message || 'Unknown error',
                status: response.status,
                pageId: pageId,
                pageUrl: window.location.href,
                timestamp: new Date().toISOString(),
            };
            console.error('Error loading static content:', errorDetails);

            // Send error details to webhook (but don't display the error widget)
            await sendErrorToWebhook(errorDetails);
            return;
        }

        // Handle successful content loading
        if (data && data.content) {
            const shadowRoot = element.attachShadow({ mode: 'open' });

            const contentContainer = document.createElement('div');
            contentContainer.innerHTML = data.content;
            shadowRoot.appendChild(contentContainer);
            console.log(`Content loaded for element with page ID: ${pageId}`);

            if (data.styles) {
                data.styles.forEach(styleUrl => {
                    console.log(`Injecting stylesheet: ${styleUrl}`);
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleUrl;
                    shadowRoot.appendChild(link);
                });
            }

            if (data.scripts) {
                data.scripts.forEach(scriptUrl => {
                    console.log(`Injecting script: ${scriptUrl}`);
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
            console.log('Custom styles applied to shadow root.');

            // Hide loading elements when content loads
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
                    console.log(`Fetching SheetDB data for element inside shadow root.`);
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
                        console.log(`Removed unmatched placeholders for element: ${el.outerHTML}`);
                    }
                } else {
                    console.warn('Missing data-sheetdb attributes for element:', el);
                }
            }

            // Load additional scripts
            loadEmbedSocialScript();
            loadAccordionInitializationScript();
            loadMobileMenuFixScript();
            loadAnchorLinkFixScript();
            loadEVModelInfoRequestPopupScript();
            loadYouTubeVideoFixScript();
        } else {
            console.error(`No content found for page ID ${normalizedPageId}`);
        }
    } catch (error) {
        const errorDetails = {
            error: error.message || 'Unknown error',
            stack: error.stack || '',
            pageId: pageId,
            pageUrl: window.location.href,
            timestamp: new Date().toISOString(),
        };
        console.error('Error loading static content:', errorDetails);

        // Send error details to webhook
        await sendErrorToWebhook(errorDetails);

        // Do not display the error widget for other errors
    }
};



    const loadStaticContentDirectly = async (element, pageId) => {
        console.log(`Fallback direct loading initiated for page ID: ${pageId}`);
        await loadStaticContent(element, pageId, null);
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

                if (ev.payload.pageName && ev.payload.pageName.includes("CHARGING_STATIONS")) {
                    console.log("Executing specific functionality for pages containing 'CHARGING_STATIONS'...");

                const loadContentPromises = Array.from(elementorDivs).map(async elementorDiv => {
                    const pageId = elementorDiv.getAttribute('data-elementor-id');
                    if (pageId) {
                        return loadStaticContent(elementorDiv, pageId, API);
                    }
                });

                Promise.all(loadContentPromises).then(() => {
                    // Load both scripts after dynamic content insertion
                    loadScriptAfterContent('https://assets.garberauto.com/assets/js/charging-stations-widget-relocate.js');
                    loadScriptAfterContent('https://assets.garberauto.com/assets/js/evModelInfoRequestPopup.js');
                });
            } else {
                elementorDivs.forEach(elementorDiv => {
                    const pageId = elementorDiv.getAttribute('data-elementor-id');
                    if (pageId) {
                        loadStaticContent(elementorDiv, pageId, API);
                    }
                });
            }
        });
    }
})(window.DDC.APILoader);
