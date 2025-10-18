pub mod api;
pub mod errors;
pub mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_prevent_default::init())
        .invoke_handler(tauri::generate_handler![
            api::directory::command::pick::pick_directory,
            api::directory::command::list::list_directory,
            api::directory::command::recent::get_recent_directories,
            api::directory::command::recent::add_recent_directory,
            api::tree::search::load_tree,
            api::tree::select::command::toggle_selection,
            api::tree::select::command::clear_selection,
            api::tree::render::count_rendered_tree_tokens,
            api::clipboard::command::copy_diffs_to_clipboard,
            api::clipboard::command::copy_all_to_clipboard,
            api::clipboard::command::copy_pages_to_clipboard,
            api::clipboard::command::copy_files_to_clipboard,
            api::clipboard::command::copy_instructions_to_clipboard,
            api::git::command::get_git_status,
            api::git::command::watch_directory_for_git_changes,
            api::web::command::save_page_as_md,
            api::web::command::delete_saved_page,
            api::web::command::list_saved_pages,
            api::web::command::edit_saved_page,
            api::instruction::command::upsert_instruction,
            api::instruction::command::delete_instructions,
            api::instruction::command::get_instruction,
            api::instruction::command::list_instructions,
            api::instruction::command::count_instruction_tokens,
            api::editor::pick_editor,
            api::editor::set_editor,
            api::editor::get_editor,
            api::editor::open_with_editor,
        ])
        .run(tauri::generate_context!())
        .expect("An error occurred while running the App");
}
