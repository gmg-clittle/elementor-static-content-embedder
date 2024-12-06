(function () {
    console.log("Running optimized mobile menu fix...");

    const menuIconSelector = '.ddc-icon-menu.ddc-icon.ddc-nav-icon';
    const mobileMenuGutterSelector = '.ddc-slidein-panel-gutter';
    const dynamicContentSelector = '.elementor-content[data-elementor-id="elementor-8208"]';

    const runFix = () => {
        console.log("Checking for shadow-root and mobile menu elements...");

        const dynamicContent = document.querySelector(dynamicContentSelector);
        const menuIcon = document.querySelector(menuIconSelector);
        const mobileMenuGutter = document.querySelector(mobileMenuGutterSelector);

        if (!dynamicContent) {
            console.warn("Dynamic content container not found.");
            return;
        }

        if (!menuIcon) {
            console.warn("Menu icon not found. Ensure the page is fully loaded.");
            return;
        }

        if (!mobileMenuGutter) {
            console.warn("Mobile menu gutter section not found. Ensure the mobile menu is initialized.");
            return;
        }

        const shadowRoot = dynamicContent.shadowRoot;

        if (shadowRoot) {
            console.log("Shadow-root found. Proceeding with fix...");

            // Backup shadow-root content
            const shadowContent = shadowRoot.innerHTML;

            // Remove shadow content
            shadowRoot.innerHTML = '';
            console.log("Shadow content temporarily removed.");

            // Open and immediately close the mobile menu
            mobileMenuGutter.click();
            console.log("Mobile menu gutter clicked to reinitialize.");

            // Restore shadow content immediately after
            setTimeout(() => {
                shadowRoot.innerHTML = shadowContent;
                console.log("Shadow content reinserted.");

                // Ensure the mobile menu is closed
                setTimeout(() => {
                    if (document.querySelector('.ddc-mobile-slidein.open')) {
                        menuIcon.click(); // Close the menu
                        console.log("Mobile menu closed to finalize the fix.");
                    }
                }, 300); // Small delay to ensure menu state is updated
            }, 300); // Adjust timing if necessary for shadow content restoration
        } else {
            console.warn("Shadow-root not found within dynamic content.");
        }
    };

    runFix();
})();
