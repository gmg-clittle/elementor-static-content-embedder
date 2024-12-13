function initializeAnchorLinkFix(shadowHostSelector) {
  try {
    console.log(`Initializing anchor link fix for shadow host: ${shadowHostSelector}`);

    // Locate shadow host
    const shadowHost = document.querySelector(shadowHostSelector);
    console.log('Checking shadow host:', shadowHost);

    if (!shadowHost) {
      throw new Error(`Shadow host (${shadowHostSelector}) not found.`);
    }

    // Access shadow root
    const shadowRoot = shadowHost.shadowRoot;
    console.log('Checking shadow root:', shadowRoot);

    if (!shadowRoot) {
      throw new Error('Shadow root not found.');
    }

    // Locate links in shadow DOM
    const links = shadowRoot.querySelectorAll('a[href^="#"]');
    console.log(`Found ${links.length} link(s) in shadow DOM:`, links);

    // Attach click listener to links
    links.forEach((link) => {
      console.log('Attaching listener to link:', link);
      link.addEventListener('click', (event) => {
        console.log('Link clicked:', link);

        const href = link.getAttribute('href');
        const targetId = href ? href.substring(1) : null;

        if (targetId) {
          console.log(`Extracted target ID: ${targetId}`);

          const targetElement = shadowRoot.querySelector(`#${targetId}`);
          if (targetElement) {
            console.log(`Found target element for #${targetId}:`, targetElement);
            event.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });
          } else {
            console.warn(`Target #${targetId} not found in shadow DOM.`);
          }
        }
      });
    });

    console.log('Listeners successfully attached to shadow DOM links.');
  } catch (error) {
    console.error('Script encountered an error:', error);
  }
}

// Example usage:
initializeAnchorLinkFix('.elementor-content');
