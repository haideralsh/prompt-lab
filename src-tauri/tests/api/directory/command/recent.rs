use promptlab_lib::api::directory::command::recent::{
    get_recent_directories_from_state, update_recent_directories,
};
use promptlab_lib::api::directory::lib::PickedDirectory;
use serde_json::json;

fn create_picked_directory(name: &str, path: &str) -> PickedDirectory {
    PickedDirectory {
        name: name.to_string(),
        path: path.to_string(),
        pretty_path: path.to_string(),
    }
}

mod get_recent_directories_tests {
    use super::*;

    #[test]
    fn test_store_completely_empty() {
        let result = get_recent_directories_from_state(None);
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_state_exists_but_no_recently_opened_key() {
        let state = json!({});
        let result = get_recent_directories_from_state(Some(&state));
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_recently_opened_value_is_not_valid_list() {
        let state = json!({
            "recently_opened_directories": "invalid"
        });
        let result = get_recent_directories_from_state(Some(&state));
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_recently_opened_list_is_explicitly_empty() {
        let state = json!({
            "recently_opened_directories": []
        });
        let result = get_recent_directories_from_state(Some(&state));
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_list_contains_valid_directory_entries() {
        let dir1 = create_picked_directory("docs", "/home/user/docs");
        let dir2 = create_picked_directory("projects", "/home/user/projects");

        let state = json!({
            "recently_opened_directories": [dir1, dir2]
        });

        let result = get_recent_directories_from_state(Some(&state));
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].name, "docs");
        assert_eq!(result[0].path, "/home/user/docs");
        assert_eq!(result[1].name, "projects");
        assert_eq!(result[1].path, "/home/user/projects");
    }
}

mod add_recent_directory_tests {
    use super::*;

    #[test]
    fn test_add_directory_to_nonexistent_list() {
        let dir = create_picked_directory("docs", "/home/user/docs");
        let new_state = update_recent_directories(None, dir);

        let list = get_recent_directories_from_state(Some(&new_state));
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "docs");
        assert_eq!(list[0].path, "/home/user/docs");
    }

    #[test]
    fn test_add_unique_directory_to_existing_list() {
        let initial_state = json!({
            "recently_opened_directories": [
                create_picked_directory("B", "/path/B"),
                create_picked_directory("C", "/path/C")
            ]
        });

        let dir_a = create_picked_directory("A", "/path/A");
        let new_state = update_recent_directories(Some(&initial_state), dir_a);

        let list = get_recent_directories_from_state(Some(&new_state));
        assert_eq!(list.len(), 3);
        assert_eq!(list[0].path, "/path/A");
        assert_eq!(list[1].path, "/path/B");
        assert_eq!(list[2].path, "/path/C");
    }

    #[test]
    fn test_add_duplicate_directory_moves_to_front() {
        let initial_state = json!({
            "recently_opened_directories": [
                create_picked_directory("A", "/path/A"),
                create_picked_directory("B", "/path/B"),
                create_picked_directory("C", "/path/C")
            ]
        });

        let dir_b = create_picked_directory("B", "/path/B");
        let new_state = update_recent_directories(Some(&initial_state), dir_b);

        let list = get_recent_directories_from_state(Some(&new_state));
        assert_eq!(list.len(), 3);
        assert_eq!(list[0].path, "/path/B");
        assert_eq!(list[1].path, "/path/A");
        assert_eq!(list[2].path, "/path/C");
    }

    #[test]
    fn test_add_directory_to_full_list_removes_oldest() {
        let initial_state = json!({
            "recently_opened_directories": [
                create_picked_directory("E", "/path/E"),
                create_picked_directory("D", "/path/D"),
                create_picked_directory("C", "/path/C"),
                create_picked_directory("B", "/path/B"),
                create_picked_directory("A", "/path/A")
            ]
        });

        let dir_f = create_picked_directory("F", "/path/F");
        let new_state = update_recent_directories(Some(&initial_state), dir_f);

        let list = get_recent_directories_from_state(Some(&new_state));
        assert_eq!(list.len(), 5);
        assert_eq!(list[0].path, "/path/F");
        assert_eq!(list[1].path, "/path/E");
        assert_eq!(list[2].path, "/path/D");
        assert_eq!(list[3].path, "/path/C");
        assert_eq!(list[4].path, "/path/B");
    }

    #[test]
    fn test_readd_existing_directory_to_full_list() {
        let initial_state = json!({
            "recently_opened_directories": [
                create_picked_directory("E", "/path/E"),
                create_picked_directory("D", "/path/D"),
                create_picked_directory("C", "/path/C"),
                create_picked_directory("B", "/path/B"),
                create_picked_directory("A", "/path/A")
            ]
        });

        let dir_c = create_picked_directory("C", "/path/C");
        let new_state = update_recent_directories(Some(&initial_state), dir_c);

        let list = get_recent_directories_from_state(Some(&new_state));
        assert_eq!(list.len(), 5);
        assert_eq!(list[0].path, "/path/C");
        assert_eq!(list[1].path, "/path/E");
        assert_eq!(list[2].path, "/path/D");
        assert_eq!(list[3].path, "/path/B");
        assert_eq!(list[4].path, "/path/A");
    }
}
