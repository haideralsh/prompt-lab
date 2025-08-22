pub mod commands;
pub mod errors;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::open_directory::open_directory,
            commands::list_directory::list_directory,
            commands::search::search_tree::search_tree,
            commands::recent_folders::get_recent_folders,
            commands::recent_folders::add_recent_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
