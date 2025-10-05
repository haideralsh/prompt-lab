pub mod api;
pub mod errors;
pub mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            api::directory::command::pick::pick_directory,
            api::directory::command::list::list_directory,
            api::directory::command::recent::get_recent_directories,
            api::directory::command::recent::add_recent_directory,
            api::directory::command::open::open_file,
            api::tree::search::search_tree,
            api::tree::select::toggle_selection,
            api::tree::select::clear_selection,
            api::clipboard::command::copy_diffs_to_clipboard,
            api::clipboard::command::copy_all_to_clipboard,
            api::clipboard::command::copy_pages_to_clipboard,
            api::clipboard::command::copy_files_to_clipboard,
            api::clipboard::command::copy_instructions_to_clipboard,
            api::git::command::get_git_status,
            api::git::command::watch_directory_for_git_changes,
            api::web::save_page_as_md,
            api::web::delete_saved_page,
            api::web::list_saved_pages,
            api::web::edit_saved_page,
            api::instruction::command::upsert_instruction,
            api::instruction::command::delete_instructions,
            api::instruction::command::list_instructions,
            api::instruction::command::count_instruction_tokens,
        ])
        .run(tauri::generate_context!())
        .expect("An error occurred while running the App");
}
