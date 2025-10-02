pub mod commands;
pub mod errors;
pub mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::directory::command::open::open_directory,
            commands::directory::command::list::list_directory,
            commands::directory::command::recent::get_recent_directories,
            commands::directory::command::recent::add_recent_directory,
            commands::tree::search::search_tree,
            commands::tree::select::toggle_selection,
            commands::tree::select::clear_selection,
            commands::clipboard::command::copy_diffs_to_clipboard,
            commands::clipboard::command::copy_all_to_clipboard,
            commands::clipboard::command::copy_pages_to_clipboard,
            commands::clipboard::command::copy_files_to_clipboard,
            commands::clipboard::command::copy_instructions_to_clipboard,
            commands::git::command::get_git_status,
            commands::git::command::watch_directory_for_git_changes,
            commands::web::save_page_as_md,
            commands::web::delete_saved_page,
            commands::web::list_saved_pages,
            commands::web::edit_saved_page,
            commands::instruction::command::save_instruction,
            commands::instruction::command::list_instructions,
        ])
        .run(tauri::generate_context!())
        .expect("An error occurred while running the App");
}
