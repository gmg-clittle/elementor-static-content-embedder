(function () {
  function initializePopupDialog(shadowRoot) {
    console.log("Initializing popup dialog within shadow DOM");

    let popupDialog = shadowRoot.getElementById('popup-dialog');
    if (!popupDialog) {
      console.log("Popup dialog not found, creating new popup elements");

      // Create the popup dialog container
      popupDialog = document.createElement('div');
      popupDialog.id = 'popup-dialog';
      popupDialog.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); justify-content: center; align-items: center; z-index: 99999;';

      // Create dialog content container
      const dialogContent = document.createElement('div');
      dialogContent.id = 'dialog-content';
      dialogContent.style.cssText = 'position: relative; width: 90%; max-width: 600px; height: 90%; background: white; border-radius: 8px; overflow: hidden;';

      // Create the iframe for content
      const iframe = document.createElement('iframe');
      iframe.id = 'popup-iframe';
      iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
      iframe.src = ''; // Set dynamically when opened

      // Create the close button
      const closeButton = document.createElement('button');
      closeButton.id = 'close-popup';
      closeButton.innerHTML = '&times;';
      closeButton.style.cssText = 'position: absolute; top: 10px; right: 10px; background: none; color: black; border: none; font-size: 20px; cursor: pointer;';

      // Append elements
      dialogContent.appendChild(iframe);
      dialogContent.appendChild(closeButton);
      popupDialog.appendChild(dialogContent);
      shadowRoot.appendChild(popupDialog);

      console.log("Popup elements created and appended to shadow DOM");

      // Event listener for the close button
      closeButton.addEventListener('click', () => {
        popupDialog.style.display = 'none';
        iframe.src = ''; // Clear iframe source when closed
        console.log("Popup closed via close button");
      });

      // Close popup when clicking outside dialog content
      popupDialog.addEventListener('click', (event) => {
        if (event.target === popupDialog) {
          popupDialog.style.display = 'none';
          iframe.src = ''; // Clear iframe source
          console.log("Popup closed by clicking outside dialog");
        }
      });
    }

    function openPopup(url) {
      console.log("Attempting to open popup with URL:", url);
      popupDialog.style.display = 'flex';
      const popupIframe = shadowRoot.getElementById('popup-iframe');
      if (popupIframe) {
        popupIframe.src = url;
        console.log("Popup iframe URL set to:", url);
      } else {
        console.error("Popup iframe not found in shadow DOM.");
      }
    }

    // Listen for a 'formSubmitted' message from the iframe
    window.addEventListener('message', (event) => {
      if (event.data && event.data.action === 'formSubmitted') {
        console.log("Form submitted message received. Closing popup after 3 seconds.");
        setTimeout(() => {
          popupDialog.style.display = 'none';
          const popupIframe = shadowRoot.getElementById('popup-iframe');
          if (popupIframe) {
            popupIframe.src = ''; // Clear iframe source when closed
          }
          console.log("Popup closed after successful form submission.");
        }, 3000); // Close 3 seconds after form submission
      }
    });

    function findAndAttachCTA() {
      let ctaLink = shadowRoot.querySelector('a[href^="#request-information-ev-form&make="]');
      if (!ctaLink) {
        ctaLink = shadowRoot.querySelector('a[href*="request-information-ev-form"]');
        if (ctaLink) {
          console.log("CTA link found using fallback selector:", ctaLink);
        } else {
          console.warn("CTA link not found in shadow DOM with either selector, retrying...");
          setTimeout(findAndAttachCTA, 500); // Retry after 500ms if CTA link not found
          return;
        }
      }

      if (ctaLink) {
        ctaLink.addEventListener('click', (event) => {
          event.preventDefault();
          console.log("CTA link clicked");

          const hash = ctaLink.getAttribute('href');
          const hashParams = new URLSearchParams(hash.replace('#request-information-ev-form&', ''));
          const model = hashParams.get('model');
          const make = hashParams.get('make');
          const ddcId = hashParams.get('ddcId');

          console.log("Extracted parameters - Make:", make, "Model:", model, "DDC ID:", ddcId);

          if (model && make) {
            const iframeUrl = `https://gmg-digital.vercel.app/ev-info-request?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}${ddcId ? `&ddcId=${encodeURIComponent(ddcId)}` : ''}`;
            openPopup(iframeUrl);
          } else {
            console.warn("Model or make parameter missing in CTA link hash.");
          }
        });
      }
    }

    findAndAttachCTA(); // Initialize CTA link detection
  }

  function detectAndInitializePopup() {
    const container = document.querySelector('.elementor-content');
    if (container && container.shadowRoot) {
      console.log("Shadow root detected in .elementor-content container");
      initializePopupDialog(container.shadowRoot);
    } else {
      console.log("No shadow root detected on initial load.");
      const observer = new MutationObserver(() => {
        const container = document.querySelector('.elementor-content');
        if (container && container.shadowRoot) {
          console.log("Shadow root detected by MutationObserver");
          initializePopupDialog(container.shadowRoot);
          observer.disconnect(); 
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  detectAndInitializePopup(); // Immediately run initialization
})();
