pub mod commands;
pub mod errors;
pub mod models;
pub mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::directory::open::open_directory,
            commands::directory::list::list_directory,
            commands::directory::recent::get_recent_directories,
            commands::directory::recent::add_recent_directory,
            commands::directory::display::pretty_directory_path,
            commands::tree::search::search_tree,
            commands::tree::select::toggle_selection,
            commands::tree::select::clear_selection,
            commands::clipboard::copy_diff_to_clipboard,
            commands::clipboard::copy_files_to_clipboard,
            commands::clipboard::copy_page_to_clipboard,
            commands::clipboard::copy_all_pages_to_clipboard,
            commands::git::command::git_status,
            commands::web::save_page_as_md,
            commands::web::delete_saved_page,
            commands::web::list_saved_pages,
            commands::app::load_application_data,
        ])
        .run(tauri::generate_context!())
        .expect("An error occurred while running the Contexter");
}
