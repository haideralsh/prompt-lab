pub mod commands;
pub mod errors;
pub mod lifecycle;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(lifecycle::ShutdownState::default())
        .on_window_event(lifecycle::handle_window_event)
        .invoke_handler(tauri::generate_handler![
            commands::directory::open::open_directory,
            commands::directory::list::list_directory,
            commands::directory::recent::get_recent_directories,
            commands::directory::recent::add_recent_directory,
            commands::directory::display::pretty_directory_path,
            commands::tree::search::search_tree,
            commands::tree::select::toggle_selection,
            commands::tree::select::clear_selection,
            commands::clipboard::copy_files_to_clipboard,
            commands::git::git_status,
            commands::scrape::page_to_md,
            commands::app::persist_application_data_and_exit,
            commands::app::load_application_data,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(lifecycle::handle_run_event);
}
