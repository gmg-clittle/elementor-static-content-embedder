function initializeYoutubeVideo() {
    try {
        console.log("Initializing YouTube Video functionality...");

        // Locate shadow host
        const shadowHost = document.querySelector('.elementor-content');
        if (!shadowHost) throw new Error("Shadow host (.elementor-content) not found.");

        // Access shadow root
        const shadowRoot = shadowHost.shadowRoot;
        if (!shadowRoot) throw new Error("Shadow root not found for the shadow host.");
        console.log("Shadow root found for:", '.elementor-content');

        // Set root for querying elements
        const root = shadowRoot;
        console.log("Root for querying elements:", root);

        // Locate play button
        const playButton = root.querySelector('.elementor-custom-embed-play');
        if (!playButton) throw new Error("Play button (.elementor-custom-embed-play) not found.");
        console.log("Play button located:", playButton);

        // Locate the parent widget element with the `data-settings` attribute specific to the video widget
        const videoWidgetElement = playButton.closest('.elementor-widget-video[data-settings]');
        if (!videoWidgetElement) throw new Error("Video widget element with data-settings attribute not found.");
        console.log("Video widget element located:", videoWidgetElement);

        // Extract widget settings
        const widgetSettings = JSON.parse(videoWidgetElement.getAttribute('data-settings').replace(/&quot;/g, '"'));
        console.log("Widget settings:", widgetSettings);

        // Identify YouTube URL
        const youtubeUrl = widgetSettings.youtube_url;
        if (!youtubeUrl) throw new Error("YouTube URL not found in widget settings.");
        console.log("YouTube URL identified:", youtubeUrl);

        // Locate the video container
        const videoContainer = videoWidgetElement.querySelector('.elementor-video');
        if (!videoContainer) throw new Error("Video container (.elementor-video) not found.");
        console.log("Video container located:", videoContainer);

        // Locate the custom image overlay
        const customImageOverlay = videoWidgetElement.querySelector('.elementor-custom-embed-image-overlay');
        if (!customImageOverlay) throw new Error("Custom image overlay (.elementor-custom-embed-image-overlay) not found.");
        console.log("Custom image overlay located:", customImageOverlay);

        // Attach click event listener to play button
        playButton.addEventListener('click', () => {
            console.log("Play button clicked.");

            // Remove the custom image overlay
            customImageOverlay.remove();
            console.log("Custom image overlay removed.");

            // Check if an iframe is already present
            const existingIframe = videoContainer.querySelector('iframe');
            if (existingIframe) {
                console.log("Iframe already present, skipping injection.");
                return;
            }

            console.log("Embedding YouTube video...");

            // Generate iframe source URL with correct query parameters
            const embedUrl = youtubeUrl
                .replace('watch?v=', 'embed/')
                + '?controls=1&rel=0&playsinline=0&modestbranding=0&autoplay=1&enablejsapi=1'
                + '&origin=' + encodeURIComponent(window.location.origin);

            // Create and insert iframe for YouTube video
            const iframe = document.createElement('iframe');
            iframe.src = embedUrl;
            iframe.frameBorder = "0";
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = "strict-origin-when-cross-origin";
            iframe.style.width = "100%";
            iframe.style.height = "360px"; // Set a proper height for better visibility
            iframe.style.maxHeight = "500px"; // Optional: limit height on larger screens

            // Clear any existing content in the container and append the iframe
            videoContainer.innerHTML = '';
            videoContainer.appendChild(iframe);

            console.log("YouTube video iframe injected successfully:", iframe);
        });

        console.log("Click event listener attached to play button.");
    } catch (error) {
        console.error("Error initializing YouTube video functionality:", error);
    }
}
