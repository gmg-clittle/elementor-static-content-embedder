# Elementor Static Content Embedder

## Description

Elementor Static Content Embedder is a WordPress plugin that converts Elementor pages to static HTML/CSS/JS content, saves them in the database, and provides an admin interface for managing and embedding these static pages. This plugin is particularly useful for improving page load times and enabling the embedding of Elementor-created content on external websites.

## Features

1. Admin interface for generating and managing static content
2. Automatic conversion of Elementor pages to static HTML/CSS/JS
3. Database storage for static content
4. Automatic regeneration of static content when a page is updated
5. API endpoint for serving static content
6. Easy embedding of static content on external sites

## Installation

1. Upload the plugin files to the `/wp-content/plugins/elementor-static-content-embedder` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.

## Usage

### Generating Static Content

1. Navigate to the 'Static Content' menu in the WordPress admin panel.
2. Select an Elementor page from the dropdown menu.
3. Click 'Generate Static Content' to create a static version of the selected page.

### Embedding Static Content

After generating static content, you'll see a unique Elementor div ID for each page. To embed this content on an external site:

1. Add the following div to your external site where you want the content to appear:

   ```html
   <div id="elementor-{PAGE_ID}"></div>
   ```

   Replace `{PAGE_ID}` with the actual page ID.

2. Include the necessary JavaScript to fetch and inject the static content

## API Endpoint

The plugin provides an API endpoint to serve static content:

`GET /wp-json/elementor/v1/static-content/{PAGE_ID}`

This endpoint returns a JSON object containing the static content, associated styles and scripts, and metadata.

## Automatic Updates

The plugin automatically regenerates static content when an Elementor page is updated, ensuring that the embedded content always reflects the latest version of the page.

## Uninstallation

When the plugin is uninstalled, it will automatically remove the database table used for storing static content.

## Support

For support or feature requests, please contact the Garber Digital Marketing Team.

## Version

Current Version: 1.6

## Author

Garber Digital Marketing Team
