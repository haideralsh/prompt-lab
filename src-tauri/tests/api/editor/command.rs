use promptlab_lib::api::editor::command::{get_editor_from_config, set_editor_in_config};
use serde_json::Map;

#[test]
fn test_set_and_get_editor_in_config() {
    let mut config = Map::new();

    assert_eq!(get_editor_from_config(&config), None);

    let editor_path = "/Applications/TestEditor.app".to_string();
    set_editor_in_config(&mut config, editor_path.clone());

    assert_eq!(get_editor_from_config(&config), Some(editor_path));
}

#[test]
fn test_set_editor_overwrites_existing_in_config() {
    let mut config = Map::new();

    let first = "/Applications/FirstEditor.app".to_string();
    set_editor_in_config(&mut config, first.clone());
    assert_eq!(get_editor_from_config(&config), Some(first.clone()));

    let second = "/Applications/SecondEditor.app".to_string();
    set_editor_in_config(&mut config, second.clone());
    assert_eq!(get_editor_from_config(&config), Some(second));
}
