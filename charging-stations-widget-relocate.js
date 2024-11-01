// Function to move afdc-stations content to the placeholder in elementor-content
function moveAFDCWidgetToPlaceholder() {
    // Select the main shadow host and the afdc-stations host
    const mainShadowHost = document.querySelector('.elementor-content');
    const afdcHost = document.querySelector('#afdc-stations');

    // Ensure both shadow roots are accessible
    if (!mainShadowHost || !mainShadowHost.shadowRoot || !afdcHost || !afdcHost.shadowRoot) {
        console.error("One or both shadow roots are not accessible.");
        return;
    }

    // Locate the placeholder within the main shadow root
    const placeholder = mainShadowHost.shadowRoot.querySelector('#afdc-stations-loading');
    if (!placeholder) {
        console.error("Placeholder div not found in main shadow root.");
        return;
    }

    // Move each node from afdc-stations shadow root to the placeholder
    const widgetContent = [...afdcHost.shadowRoot.childNodes];
    widgetContent.forEach(node => placeholder.appendChild(node));

    console.log("AFDC widget content successfully moved to the main shadow root.");
}

// Run the function to move the widget content after a 2-second delay
setTimeout(moveAFDCWidgetToPlaceholder, 2000);
