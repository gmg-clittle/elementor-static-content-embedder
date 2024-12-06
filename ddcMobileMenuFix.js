function initializeMobileMenuFix() {
    console.log("Setting up mobile menu fix...");

    const menuIconSelector = '.ddc-icon-menu.ddc-icon.ddc-nav-icon';
    const mobileMenuGutterSelector = '.ddc-slidein-panel-gutter';
    const dynamicContentSelector = '.elementor-content';

    // Check if the user is on a mobile device
    const isMobile = () => window.innerWidth <= 768;

    // Function to add a delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Function to ensure elements are ready before applying the fix
    const waitForElement = async (selector, timeout = 5000) => {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) return element;
            await delay(100); // Retry every 100ms
        }
        throw new Error(`Element not found: ${selector}`);
    };

    // Function to apply the fix
    const applyMobileMenuFix = async () => {
        console.log("Running mobile menu fix...");

        try {
            const dynamicContent = await waitForElement(dynamicContentSelector);
            const menuIcon = await waitForElement(menuIconSelector);
            const mobileMenuGutter = await waitForElement(mobileMenuGutterSelector);

            const shadowRoot = dynamicContent.shadowRoot;

            if (shadowRoot) {
                console.log("Shadow-root found. Proceeding with fix...");

                // Backup shadow-root content
                const shadowContent = shadowRoot.innerHTML;

                // Remove shadow content
                shadowRoot.innerHTML = '';
                console.log("Shadow content temporarily removed.");

                // Open the mobile menu
                mobileMenuGutter.click();
                console.log("Mobile menu gutter clicked to initialize.");

                // Restore shadow content
                await delay(300); // Ensure menu initialization timing
                shadowRoot.innerHTML = shadowContent;
                console.log("Shadow content reinserted.");

                console.log("Mobile menu fix completed successfully. Menu remains open.");
            } else {
                console.warn("Shadow-root not found within dynamic content.");
            }
        } catch (error) {
            console.error("Error during mobile menu fix:", error);
        }
    };

    // Attach the fix to the menu icon click event
    const setupMenuClickListener = async () => {
        try {
            const menuIcon = await waitForElement(menuIconSelector);
            let clickCount = 0;

            menuIcon.addEventListener('click', async function handleMenuClick() {
                clickCount++;
                console.log(`Menu icon clicked. Applying fix (click count: ${clickCount})...`);

                if (isMobile()) {
                    await applyMobileMenuFix();
                } else {
                    console.log("User is not on a mobile device. Fix skipped.");
                }

                // Stop applying the fix after 3 clicks
                if (clickCount >= 3) {
                    console.log("Menu fix applied 3 times. Removing listener.");
                    menuIcon.removeEventListener('click', handleMenuClick);
                }
            });

            console.log("Listener added to menu icon for mobile menu fix.");
        } catch (error) {
            console.error("Error setting up menu click listener:", error);
        }
    };

    setupMenuClickListener();
}

// Initialize the script
initializeMobileMenuFix();
