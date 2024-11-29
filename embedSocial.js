(function (global) {
    function initializeEmbedSocial() {
        console.log("Initializing EmbedSocial Reviews for shadow roots...");

        const adjustEmbedSocialHeight = (element) => {
            console.log("Adjusting height for .embedsocial-reviews iframe...");
            const iframe = element.querySelector('iframe');
            if (iframe) {
                iframe.style.width = "100%";
                iframe.style.minHeight = "600px";
                iframe.style.height = "100vh";
                iframe.style.border = "none";
                console.log("Adjusted iframe styles:", iframe.style.cssText);

                if (typeof window.iFrameResize === "function") {
                    window.iFrameResize({}, iframe);
                    console.log("iFrameResize initialized for iframe.");
                } else {
                    console.warn("iFrameResize is not available. Ensure EmbedSocial script includes iFrameResize support.");
                }
            } else {
                console.warn("No iframe found inside .embedsocial-reviews element:", element);
            }
        };

        const processEmbedSocialElement = (element, dataRef) => {
            console.log(`Processing .embedsocial-reviews element:`, element);
            if (typeof window.EMBEDSOCIALREVIEWS !== 'undefined' && typeof window.EMBEDSOCIALREVIEWS.getEmbedData === 'function') {
                console.log(`Calling EMBEDSOCIALREVIEWS.getEmbedData for data-ref: ${dataRef}`);
                window.EMBEDSOCIALREVIEWS.getEmbedData(dataRef, element);
                setTimeout(() => adjustEmbedSocialHeight(element), 2000);
            } else {
                console.error("EMBEDSOCIALREVIEWS.getEmbedData function is not available.");
            }
        };

        const findAndInitializeReviews = () => {
            const shadowRoots = [...document.querySelectorAll('*')].filter(el => el.shadowRoot);
            console.log(`Found ${shadowRoots.length} shadow roots in the document.`);

            shadowRoots.forEach((hostElement, index) => {
                console.log(`Checking shadow root ${index + 1}:`, hostElement);
                const reviewsElements = hostElement.shadowRoot.querySelectorAll('.embedsocial-reviews');
                reviewsElements.forEach(element => {
                    const dataRef = element.getAttribute('data-ref');
                    if (dataRef) {
                        processEmbedSocialElement(element, dataRef);
                    } else {
                        console.warn("No data-ref attribute found for .embedsocial-reviews element:", element);
                    }
                });
            });

            const reviewsElements = document.querySelectorAll('.embedsocial-reviews');
            reviewsElements.forEach(element => {
                const dataRef = element.getAttribute('data-ref');
                if (dataRef) {
                    processEmbedSocialElement(element, dataRef);
                } else {
                    console.warn("No data-ref attribute found for .embedsocial-reviews element in main DOM:", element);
                }
            });
        };

        const ensureEmbedSocialScriptLoaded = () => {
            const scriptSrc = "https://embedsocial.com/embedscript/ri.js";
            const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);

            if (!existingScript) {
                console.log("Injecting EmbedSocial script...");
                const script = document.createElement('script');
                script.src = scriptSrc;
                script.async = true;
                script.onload = () => {
                    console.log("EmbedSocial script loaded successfully. Initializing reviews...");
                    findAndInitializeReviews();
                };
                script.onerror = (error) => {
                    console.error("Failed to load EmbedSocial script:", error);
                };
                document.body.appendChild(script);
            } else {
                console.log("EmbedSocial script already present. Initializing reviews...");
                findAndInitializeReviews();
            }
        };

        const injectCustomCSS = () => {
            console.log("Injecting custom CSS for EmbedSocial reviews...");
            const style = document.createElement('style');
            style.textContent = `
                .embedsocial-reviews {
                    display: block;
                    width: 100%;
                    height: 100%;
                    min-height: 600px;
                    overflow: hidden;
                }
                .embedsocial-reviews iframe {
                    display: block;
                    width: 100%;
                    height: 100vh;
                    border: none;
                }
                body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                }
            `;
            document.head.appendChild(style);
        };

        injectCustomCSS();

        if (document.readyState === "complete" || document.readyState === "interactive") {
            console.log("Page is already loaded. Proceeding with EmbedSocial initialization...");
            ensureEmbedSocialScriptLoaded();
        } else {
            console.log("Waiting for the page to fully load...");
            window.addEventListener('load', ensureEmbedSocialScriptLoaded);
        }
    }

    // Export the function to the global namespace
    global.initializeEmbedSocial = initializeEmbedSocial;
})(window);
