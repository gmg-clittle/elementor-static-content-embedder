# Elementor Static Content Embedder with Logging

This plugin generates static HTML/CSS/JS from Elementor pages, saving content in the database. It provides an admin interface for managing these static pages, including logs for generation events. JavaScript integration also handles dynamic loading and fallback procedures for Dealer.com API.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Plugin Structure](#plugin-structure)
- [Admin Interface](#admin-interface)
- [JavaScript Integration](#javascript-integration)

---

## Installation

To install the plugin:
1. Download the plugin ZIP and upload it to your WordPress plugins directory.
2. Activate the plugin via the WordPress Admin panel.

This plugin requires:
- WordPress REST API enabled
- Elementor plugin installed for page generation

## Usage

1. **Admin Interface**: Navigate to the **GMG Digital - Elementor Exporter** section in the WordPress admin panel.
2. **Static Content Generation**:
   - Select an Elementor page from the dropdown and click **Generate Static Content**.
3. **Embed Code**: Copy the generated HTML embed code to place on the target site.

## Plugin Structure

- **Admin Menu**:
  - **GMG Digital - Elementor Exporter**: Interface for generating static pages.
  - **Logs**: Displays up to 50 recent generation events, including page ID, event type, message, and date.

---

## Admin Interface

### Static Page Generation

The admin page provides a dropdown of available Elementor pages. Select a page and click **Generate Static Content** to create a static version. This will:
- Save HTML content, CSS, and JavaScript to the database.
- Generate a unique `elementor_div_id` for embedding.
- Display an HTML embed code for external usage.

### Logs Page

The **Logs** submenu records generation events with details, including:
- Event type (e.g., success or error)
- Page ID
- Message with event details
- Date and time of each event

---

## JavaScript Integration

The JavaScript component dynamically loads static content using Dealer.com API. If the API is unavailable, it falls back to direct content loading.

### Key Functions

- **DDC API Creation**: Attempts to create the API with retry logic.
- **Content Fallback**: Directly loads content if the API fails.
- **Loading Indicator Update**: Displays a fallback message if content loading is delayed.
- **SheetDB Integration**: Fetches content based on `Make` and `Model` attributes for dynamic content updates.

---

## API Routes

A REST API route `/wp-json/elementor/v1/static-content/{id}` is registered to retrieve stored static content based on page ID.

Example response:
```json
{
    "content": "HTML content",
    "styles": ["style1.css", "style2.css"],
    "scripts": ["script1.js", "script2.js"],
    "elementor_div_id": "elementor-123",
    "generated_at": "2023-12-01 10:00:00",
    "notes": "Notes about this page"
}
