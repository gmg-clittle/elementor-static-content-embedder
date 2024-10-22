<?php
/*
Plugin Name: Elementor Static Content Embedder with Logging
Description: Converts Elementor pages to static HTML/CSS/JS using wp_remote_get, saves them in the database, and provides an admin interface for managing and embedding them. Also includes logging for generation events.
Version: 1.8
Author: Garber Digital Marketing Team
*/

// Create admin menu for static page generator and logs
add_action('admin_menu', 'esc_create_admin_menu');
function esc_create_admin_menu() {
    add_menu_page(
        'Elementor Static Content',  // Page title
        'GMG Digital - Elementor Exporter',  // Menu title
        'manage_options',  // Capability
        'static-content-generator',  // Menu slug
        'esc_admin_page',  // Callback function
        'dashicons-car',  // Icon
        100  // Position
    );

    // Add sub-menu for logs
    add_submenu_page(
        'static-content-generator',  // Parent slug
        'Generation Logs',  // Page title
        'Logs',  // Sub-menu title
        'manage_options',  // Capability
        'static-content-logs',  // Menu slug
        'esc_logs_page'  // Callback function
    );
}

function esc_logs_page() {
    global $wpdb;
    $log_table_name = $wpdb->prefix . 'elementor_static_content_logs';

    // Fetch logs from the database
    $logs = $wpdb->get_results("SELECT * FROM $log_table_name ORDER BY created_at DESC LIMIT 50");

    ?>
    <div class="wrap">
        <h1>Generation Logs</h1>
        <table class="widefat fixed" cellspacing="0">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Event Type</th>
                    <th>Page ID</th>
                    <th>Message</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($logs)) {
                    foreach ($logs as $log) {
                        ?>
                        <tr>
                            <td><?php echo esc_html($log->id); ?></td>
                            <td><?php echo esc_html($log->event_type); ?></td>
                            <td><?php echo esc_html($log->page_id); ?></td>
                            <td><?php echo esc_html($log->message); ?></td>
                            <td><?php echo esc_html($log->created_at); ?></td>
                        </tr>
                        <?php
                    }
                } else {
                    echo '<tr><td colspan="5">No log events yet.</td></tr>';
                } ?>
            </tbody>
        </table>
    </div>
    <?php
}


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

    // Fetch debug logs
    $debug_logs = get_option('esc_debug_logs', []);

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

        <?php
        // Display debug logs if available
        if (!empty($debug_logs)) {
            echo '<div class="notice notice-info"><pre>' . esc_html(implode("\n", $debug_logs)) . '</pre></div>';
            // Clear logs after displaying
            delete_option('esc_debug_logs');
        }
        ?>

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
                                <textarea readonly><?php echo esc_html($static_page->html_embed_code); ?></textarea>
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


function esc_generate_static_content($page_id, $auto_trigger = false) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'elementor_static_content';
    $page = get_post($page_id);
    $debug_logs = [];

    if (!$page || $page->post_status !== 'publish') {
        esc_log_event('error', $page_id, 'Invalid page selected.');
        $debug_logs[] = 'Invalid page selected.';
        if (!$auto_trigger) {
            echo '<div class="notice notice-error"><p>Invalid page selected.</p></div>';
        }
        update_option('esc_debug_logs', $debug_logs);
        return;
    }

    // Fetch the full rendered page content using wp_remote_get
    $page_url = get_permalink($page_id);
    $response = wp_remote_get($page_url);
    if (is_wp_error($response)) {
        $debug_logs[] = 'Error fetching page: ' . $response->get_error_message();
        esc_log_event('error', $page_id, 'Error fetching page: ' . $response->get_error_message());
        if (!$auto_trigger) {
            echo '<div class="notice notice-error"><p>Error fetching page: ' . $response->get_error_message() . '</p></div>';
        }
        update_option('esc_debug_logs', $debug_logs);
        return;
    }

    // Retrieve the HTML content from the response body
    $content = wp_remote_retrieve_body($response);
    $debug_logs[] = 'HTML content retrieved from page URL.';

    // Parse the content and extract CSS and JS file references
    $styles = [];
    $scripts = [];

    preg_match_all('/<link.*?href=[\'"](.*?\.css.*?)[\'"].*?>/i', $content, $style_matches);
    if (!empty($style_matches[1])) {
        $styles = $style_matches[1];
        $debug_logs[] = 'CSS styles extracted.';
    }

    preg_match_all('/<script.*?src=[\'"](.*?\.js.*?)[\'"].*?>/i', $content, $script_matches);
    if (!empty($script_matches[1])) {
        $scripts = $script_matches[1];
        $debug_logs[] = 'JS scripts extracted.';
    }

    $elementor_div_id = 'elementor-' . $page_id;
    $debug_logs[] = 'Elementor Div ID generated: ' . $elementor_div_id;

    // Fetch the seo_content from the WordPress REST API
    $rest_api_url = get_rest_url(null, '/wp/v2/pages/' . $page_id);
    $rest_response = wp_remote_get($rest_api_url);
    $seo_content_html = '';

    if (!is_wp_error($rest_response)) {
        $rest_body = wp_remote_retrieve_body($rest_response);
        $rest_data = json_decode($rest_body, true);

        $debug_logs[] = 'REST API response received.';
        if (isset($rest_data['acf']) && isset($rest_data['acf']['seo_content'])) {
            $seo_content = $rest_data['acf']['seo_content'];
            $seo_content_html = '<div class="hidden-content-container">' . esc_html($seo_content) . '</div>';
            $debug_logs[] = 'SEO Content retrieved: ' . $seo_content;
        } else {
            $debug_logs[] = 'No SEO Content found in REST API response.';
        }
    } else {
        $debug_logs[] = 'Error fetching REST API response: ' . $rest_response->get_error_message();
    }

    // Generate the HTML Embed Code
    $html_embed_code = '<div class="elementor-content" data-elementor-id="' . esc_attr($elementor_div_id) . '"></div>' .
                       '<style>.loading-container{display:flex;justify-content:center;align-items:center;padding:20px;margin-bottom:20px;height:200px}.loading-iframe{width:100%;height:100px;border:none}</style>' .
                       '<div class="loading-container"><iframe class="loading-iframe" src="https://gmg-digital.vercel.app/loading-widget"></iframe></div>' .
                       $seo_content_html;

    $debug_logs[] = 'Generated HTML Embed Code: ' . $html_embed_code;

    $columns = $wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'html_embed_code'");
    if (empty($columns)) {
        $wpdb->query("ALTER TABLE $table_name ADD html_embed_code LONGTEXT");
        $debug_logs[] = 'Added missing html_embed_code column to the table.';
    }

    $existing_row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE page_id = %d", $page_id));
    if ($existing_row) {
        // If row exists, perform the update
        $update_result = $wpdb->update(
            $table_name,
            [
                'content' => $content,
                'elementor_div_id' => $elementor_div_id,
                'generated_at' => current_time('mysql'),
                'notes' => '',
                'styles' => maybe_serialize($styles),
                'scripts' => maybe_serialize($scripts),
                'html_embed_code' => $html_embed_code
            ],
            ['page_id' => $page_id],
            ['%s', '%s', '%s', '%s', '%s', '%s', '%s'],
            ['%d']
        );

        if ($update_result === false) {
            $debug_logs[] = 'Failed to update the static content in the database. Last error: ' . $wpdb->last_error;
        } else if ($update_result === 0) {
            $debug_logs[] = 'Update query ran, but no rows were affected. Forcing update...';
            // Force update by deleting and re-inserting the row
            $wpdb->delete($table_name, ['page_id' => $page_id], ['%d']);
            $insert_result = $wpdb->insert(
                $table_name,
                [
                    'page_id' => $page_id,
                    'content' => $content,
                    'elementor_div_id' => $elementor_div_id,
                    'generated_at' => current_time('mysql'),
                    'notes' => '',
                    'styles' => maybe_serialize($styles),
                    'scripts' => maybe_serialize($scripts),
                    'html_embed_code' => $html_embed_code
                ],
                ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
            );
            if ($insert_result === false) {
                $debug_logs[] = 'Failed to force insert after update failure. Last error: ' . $wpdb->last_error;
            } else {
                $debug_logs[] = 'Successfully forced insert after update failure.';
            }
        } else {
            $debug_logs[] = 'Successfully updated the static content in the database.';
        }
    } else {
        // Insert new row if it doesn't exist
        $insert_result = $wpdb->insert(
            $table_name,
            [
                'page_id' => $page_id,
                'content' => $content,
                'elementor_div_id' => $elementor_div_id,
                'generated_at' => current_time('mysql'),
                'notes' => '',
                'styles' => maybe_serialize($styles),
                'scripts' => maybe_serialize($scripts),
                'html_embed_code' => $html_embed_code
            ],
            ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
        );

        if ($insert_result === false) {
            $debug_logs[] = 'Failed to insert the static content into the database. Last error: ' . $wpdb->last_error;
        } else {
            $debug_logs[] = 'Successfully inserted the static content into the database.';
        }
    }

    update_option('esc_debug_logs', $debug_logs);

    $trigger_type = $auto_trigger ? 'auto-generation' : 'manual-generation';
    esc_log_event('generation', $page_id, "Static content $trigger_type triggered and generated successfully.");

    if (!$auto_trigger) {
        echo '<div class="notice notice-success"><p>Static page generated and saved successfully. Add this div ID: <strong>' . $elementor_div_id . '</strong> to your dealership site.</p></div>';
    }
}




// Function to trigger static content regeneration on page update
add_action('save_post', 'esc_auto_generate_static_content', 10, 2);
function esc_auto_generate_static_content($post_id, $post) {
    // Ensure it's an Elementor page that we care about, and it's a published page
    if ($post->post_type === 'page' && $post->post_status === 'publish') {
        global $wpdb;
        $table_name = $wpdb->prefix . 'elementor_static_content';

        // Check if the page has already been generated as static content
        $static_page = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE page_id = %d", $post_id));

        // If the static content already exists in the database, regenerate it
        if ($static_page && !wp_next_scheduled('esc_delayed_static_generation', array($post_id))) {
            // Schedule the content regeneration event after a short delay (2 seconds)
            // This prevents duplicate scheduling
            wp_schedule_single_event(time() + 2, 'esc_delayed_static_generation', array($post_id));
        }
    }
}


// Function to handle the delayed static generation
add_action('esc_delayed_static_generation', 'esc_generate_static_content', 10, 1);


// Function to log events to the database
function esc_log_event($event_type, $page_id, $message) {
    global $wpdb;
    $log_table_name = $wpdb->prefix . 'elementor_static_content_logs';

    $wpdb->insert(
        $log_table_name,
        [
            'event_type' => $event_type,
            'page_id' => $page_id,
            'message' => $message,
            'created_at' => current_time('mysql')
        ],
        ['%s', '%d', '%s', '%s']
    );
}

// Create and update database table for storing static content and logs
register_activation_hook(__FILE__, 'esc_create_db');
function esc_create_db() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'elementor_static_content';
    $log_table_name = $wpdb->prefix . 'elementor_static_content_logs';
    $charset_collate = $wpdb->get_charset_collate();

    // Create static content table
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

    // Create logs table
    $sql_log = "CREATE TABLE IF NOT EXISTS $log_table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        event_type varchar(50) NOT NULL,
        page_id bigint(20) NOT NULL,
        message text NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    dbDelta($sql_log);
}

// Uninstall hook to remove database table on plugin removal
register_uninstall_hook(__FILE__, 'esc_remove_db');
function esc_remove_db() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'elementor_static_content';
    $log_table_name = $wpdb->prefix . 'elementor_static_content_logs';
    $wpdb->query("DROP TABLE IF EXISTS $table_name");
    $wpdb->query("DROP TABLE IF EXISTS $log_table_name");
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
