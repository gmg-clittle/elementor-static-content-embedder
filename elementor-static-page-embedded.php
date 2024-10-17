<?php
/*
Plugin Name: Elementor Static Content Embedder
Description: Converts Elementor pages to static HTML/CSS/JS using wp_remote_get, saves them in the database, and provides an admin interface for managing and embedding them.
Version: 1.6
Author: Garber Digital Marketing Team
*/

// Create admin menu for static page generator
add_action('admin_menu', 'esc_create_admin_menu');
function esc_create_admin_menu() {
    add_menu_page(
        'Elementor Static Content',  // Page title
        'Static Content',            // Menu title
        'manage_options',            // Capability
        'static-content-generator',  // Menu slug
        'esc_admin_page',            // Callback function
        'dashicons-admin-generic',   // Icon
        100                          // Position
    );
}

// Admin page content to generate and display static pages
function esc_admin_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'elementor_static_content';

    // Process form submission for generating static page
    if (isset($_POST['generate_static'])) {
        $page_id = intval($_POST['page_id']);
        if ($page_id) {
            // Generate and save the static content
            esc_generate_static_content($page_id);
        }
    }

    // Fetch stored static pages from the database
    $static_pages = $wpdb->get_results("SELECT * FROM $table_name");

    ?>
    <div class="wrap">
        <h1>Generate Static HTML for Elementor Page</h1>
        <form method="post" action="">
            <label for="page_id">Select Elementor Page:</label>
            <select name="page_id" id="page_id">
                <?php
                // Fetch all pages to select from
                $pages = get_posts(array('post_type' => 'page', 'numberposts' => -1));
                foreach ($pages as $page) {
                    echo '<option value="' . esc_attr($page->ID) . '">' . esc_html($page->post_title) . '</option>';
                }
                ?>
            </select>
            <input type="submit" name="generate_static" value="Generate Static Content" class="button-primary">
        </form>

        <h2>Generated Static Pages</h2>
        <table class="widefat fixed" cellspacing="0">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Page Title</th>
                    <th>Elementor Div ID</th>
                    <th>HTML Embed Code</th>
                    <th>Generated Date</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($static_pages)) {
                    foreach ($static_pages as $static_page) {
                        ?>
                        <tr>
                            <td><?php echo esc_html($static_page->id); ?></td>
                            <td><?php echo esc_html(get_the_title($static_page->page_id)); ?></td>
                            <td><?php echo esc_html($static_page->elementor_div_id); ?></td>
                            <td>
                                <textarea readonly><?php echo esc_html('<div id="' . $static_page->elementor_div_id . '"></div>'); ?></textarea>
                            </td>
                            <td><?php echo esc_html($static_page->generated_at); ?></td>
                            <td>
                                <textarea><?php echo esc_html($static_page->notes); ?></textarea>
                            </td>
                        </tr>
                        <?php
                    }
                } else {
                    echo '<tr><td colspan="6">No static pages generated yet.</td></tr>';
                } ?>
            </tbody>
        </table>
    </div>
    <?php
}

// Function to extract and save static content including CSS/JS
function esc_generate_static_content($page_id, $auto_trigger = false) {
    global $wpdb;
    $page = get_post($page_id);
    if (!$page || $page->post_status !== 'publish') {
        if (!$auto_trigger) {
            echo '<div class="notice notice-error"><p>Invalid page selected.</p></div>';
        }
        return;
    }

    // Fetch the full rendered page content using wp_remote_get
    $page_url = get_permalink($page_id);
    $response = wp_remote_get($page_url);
    if (is_wp_error($response)) {
        if (!$auto_trigger) {
            echo '<div class="notice notice-error"><p>Error fetching page: ' . $response->get_error_message() . '</p></div>';
        }
        return;
    }

    // Retrieve the HTML content from the response body
    $content = wp_remote_retrieve_body($response);

    // Parse the content and extract CSS and JS file references
    $styles = [];
    $scripts = [];

    // Match all <link> tags for CSS
    preg_match_all('/<link.*?href=[\'"](.*?\.css.*?)[\'"].*?>/i', $content, $style_matches);
    if (!empty($style_matches[1])) {
        $styles = $style_matches[1];  // Extract matched CSS URLs
    }

    // Match all <script> tags for JS
    preg_match_all('/<script.*?src=[\'"](.*?\.js.*?)[\'"].*?>/i', $content, $script_matches);
    if (!empty($script_matches[1])) {
        $scripts = $script_matches[1];  // Extract matched JS URLs
    }

    // Generate a unique Elementor div ID based on the page ID
    $elementor_div_id = 'elementor-' . $page_id;

    // Save the static page content, styles, scripts, and metadata in the database
    $table_name = $wpdb->prefix . 'elementor_static_content';
    $wpdb->replace(
        $table_name,
        [
            'page_id' => $page_id,
            'content' => $content,
            'elementor_div_id' => $elementor_div_id,
            'generated_at' => current_time('mysql'),
            'notes' => '',
            'styles' => maybe_serialize($styles),
            'scripts' => maybe_serialize($scripts)
        ],
        ['%d', '%s', '%s', '%s', '%s', '%s', '%s']
    );

    if (!$auto_trigger) {
        echo '<div class="notice notice-success"><p>Static page generated and saved successfully. Add this div ID: <strong>' . $elementor_div_id . '</strong> to your dealership site.</p></div>';
    }
}

// Automatically regenerate static content when a page is updated
add_action('save_post', 'esc_auto_generate_static_content', 10, 2);
function esc_auto_generate_static_content($post_id, $post) {
    // Ensure it's an Elementor page that we care about, and it's a published page
    if ($post->post_type === 'page' && $post->post_status === 'publish') {
        global $wpdb;
        $table_name = $wpdb->prefix . 'elementor_static_content';

        // Check if the page has already been generated as static content
        $static_page = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE page_id = %d", $post_id));

        // If it exists in the database, regenerate the static content
        if ($static_page) {
            esc_generate_static_content($post_id, true); // Regenerate the content using the existing function
        }
    }
}

// Create and update database table for storing static content
register_activation_hook(__FILE__, 'esc_create_db');
function esc_create_db() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'elementor_static_content';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        page_id bigint(20) NOT NULL,
        content longtext NOT NULL,
        elementor_div_id varchar(100) NOT NULL,
        generated_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        notes text DEFAULT '' NOT NULL,
        styles longtext DEFAULT '' NOT NULL,
        scripts longtext DEFAULT '' NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE (page_id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Uninstall hook to remove database table on plugin removal
register_uninstall_hook(__FILE__, 'esc_remove_db');
function esc_remove_db() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'elementor_static_content';
    $wpdb->query("DROP TABLE IF EXISTS $table_name");
}

// API route to serve static content
add_action('rest_api_init', function () {
    register_rest_route('elementor/v1', '/static-content/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'esc_get_static_content',
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param, $request, $key) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
});

// Callback function to serve static content via API
function esc_get_static_content($data) {
    global $wpdb;
    $page_id = $data['id'];
    $table_name = $wpdb->prefix . 'elementor_static_content';

    // Retrieve the static content from the database
    $static_page = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE page_id = %d", $page_id));

    if (!$static_page) {
        return new WP_Error('no_page', 'Static content not found', array('status' => 404));
    }

    // Return the static content, styles, scripts, and meta information
    return array(
        'content' => $static_page->content,
        'styles' => maybe_unserialize($static_page->styles),
        'scripts' => maybe_unserialize($static_page->scripts),
        'elementor_div_id' => $static_page->elementor_div_id,
        'generated_at' => $static_page->generated_at,
        'notes' => $static_page->notes
    );
}
?>
