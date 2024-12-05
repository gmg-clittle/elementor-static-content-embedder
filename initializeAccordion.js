// Find all elements matching the pattern .elementor-content[data-elementor-id="elementor-[Number]"]
const elementorContents = document.querySelectorAll('.elementor-content[data-elementor-id^="elementor-"]');

// Ensure at least one matching element exists
if (elementorContents.length > 0) {
    elementorContents.forEach((elementorContent) => {
        if (elementorContent.shadowRoot) {
            const shadowRoot = elementorContent.shadowRoot;

            // Initialize accordion functionality
            const accordionElements = shadowRoot.querySelectorAll(".elementor-tab-title");

            accordionElements.forEach((accordion) => {
                accordion.addEventListener("click", function () {
                    const isActive = accordion.classList.contains("elementor-active");
                    const content = accordion.nextElementSibling;

                    if (isActive) {
                        // Close the accordion
                        accordion.classList.remove("elementor-active");
                        content.setAttribute("hidden", "hidden");
                        content.style.display = "none";
                    } else {
                        // Open the accordion
                        accordion.classList.add("elementor-active");
                        content.removeAttribute("hidden");
                        content.style.display = "block";
                    }
                });
            });

            console.log(
                `Accordion functionality initialized for elementor content with ID: ${elementorContent.getAttribute(
                    'data-elementor-id'
                )}`
            );
        } else {
            console.error(
                `Shadow root not found for elementor content with ID: ${elementorContent.getAttribute(
                    'data-elementor-id'
                )}`
            );
        }
    });
} else {
    console.error("No .elementor-content elements matching the pattern found.");
}
