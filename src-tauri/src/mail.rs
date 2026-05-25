use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs::{create_dir_all, read_to_string, write};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Mutex;

const MAX_RECENT_FOLDERS: usize = 8;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailMsg {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: Option<String>,
    pub snippet: String,
    pub from: String,
    pub subject: String,
    pub date: String,
    #[serde(rename = "senderMatch")]
    pub sender_match: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderOption {
    pub name: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkedItem {
    pub id: String,
    pub from: String,
    #[serde(rename = "folderPath")]
    pub folder_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveResult {
    pub id: String,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CommandResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct RecentFoldersFile {
    #[serde(rename = "recentFolders")]
    recent_folders: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct MarkedItemsFile {
    #[serde(rename = "markedItems")]
    marked_items: Vec<MarkedItem>,
}

#[derive(Debug, Serialize, Deserialize)]
struct HelperResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "command", rename_all = "snake_case")]
enum HelperRequest {
    ListInbox {
        request_id: String,
        max_results: u32,
    },
    ListFolders {
        request_id: String,
        depth_max: u32,
        folder_count_max: usize,
        top_level_only: bool,
    },
    MoveMessages {
        request_id: String,
        ids: Vec<String>,
        folder_path: String,
    },
}

#[derive(Default)]
pub struct MailState {
    folder_cache: Mutex<Vec<FolderOption>>,
}

fn normalize_path(value: &str) -> String {
    value.replace('\\', "/").trim().to_string()
}

fn settings_dir() -> Result<PathBuf, String> {
    let user_profile =
        std::env::var("USERPROFILE").map_err(|_| "USERPROFILE is not set".to_string())?;
    Ok(Path::new(&user_profile).join(".mado").join("madomail"))
}

fn recent_folders_path() -> Result<PathBuf, String> {
    Ok(settings_dir()?.join("recent-folders.json"))
}

fn marked_items_path() -> Result<PathBuf, String> {
    Ok(settings_dir()?.join("marked-items.json"))
}

fn ensure_settings_dir() -> Result<PathBuf, String> {
    let path = settings_dir()?;
    create_dir_all(&path).map_err(|error| error.to_string())?;
    Ok(path)
}

fn normalize_recent_folders(values: &[String]) -> Vec<String> {
    let mut unique = HashMap::<String, String>::new();
    for value in values {
        let normalized = normalize_path(value);
        if normalized.is_empty() {
            continue;
        }
        let key = normalized.to_lowercase();
        unique.entry(key).or_insert(normalized);
    }

    let mut recent_folders = unique.into_values().collect::<Vec<_>>();
    recent_folders.sort_by(|source, target| source.to_lowercase().cmp(&target.to_lowercase()));
    recent_folders.truncate(MAX_RECENT_FOLDERS);
    recent_folders
}

fn load_recent_folders_file() -> Result<Vec<String>, String> {
    let path = recent_folders_path()?;
    if !path.exists() {
        return Ok(vec![]);
    }

    let content = read_to_string(path).map_err(|error| error.to_string())?;
    let parsed: RecentFoldersFile =
        serde_json::from_str(&content).map_err(|error| error.to_string())?;
    Ok(normalize_recent_folders(&parsed.recent_folders))
}

fn save_recent_folders_file(values: &[String]) -> Result<Vec<String>, String> {
    ensure_settings_dir()?;
    let recent_folders = normalize_recent_folders(values);
    let content = serde_json::to_string_pretty(&RecentFoldersFile {
        recent_folders: recent_folders.clone(),
    })
    .map_err(|error| error.to_string())?;
    write(recent_folders_path()?, content).map_err(|error| error.to_string())?;
    Ok(recent_folders)
}

fn normalize_marked_items(values: &[MarkedItem]) -> Vec<MarkedItem> {
    values
        .iter()
        .map(|value| MarkedItem {
            id: value.id.trim().to_string(),
            from: value.from.trim().to_string(),
            folder_path: normalize_path(&value.folder_path),
        })
        .filter(|value| {
            !value.id.is_empty() && !value.from.is_empty() && !value.folder_path.is_empty()
        })
        .collect()
}

fn load_marked_items_file() -> Result<Vec<MarkedItem>, String> {
    let path = marked_items_path()?;
    if !path.exists() {
        return Ok(vec![]);
    }

    let content = read_to_string(path).map_err(|error| error.to_string())?;
    let parsed: MarkedItemsFile =
        serde_json::from_str(&content).map_err(|error| error.to_string())?;
    Ok(normalize_marked_items(&parsed.marked_items))
}

fn save_marked_items_file(values: &[MarkedItem]) -> Result<Vec<MarkedItem>, String> {
    ensure_settings_dir()?;
    let marked_items = normalize_marked_items(values);
    let content = serde_json::to_string_pretty(&MarkedItemsFile {
        marked_items: marked_items.clone(),
    })
    .map_err(|error| error.to_string())?;
    write(marked_items_path()?, content).map_err(|error| error.to_string())?;
    Ok(marked_items)
}

fn resolve_helper_path() -> Result<PathBuf, String> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let candidate_paths = [
        manifest_dir
            .join("helper_com_rs")
            .join("target")
            .join("debug")
            .join("helper_com_rs.exe"),
        manifest_dir
            .join("helper_com_rs")
            .join("target")
            .join("release")
            .join("helper_com_rs.exe"),
        manifest_dir
            .parent()
            .ok_or_else(|| "Failed to resolve project root".to_string())?
            .join("helper_com_rs")
            .join("target")
            .join("debug")
            .join("helper_com_rs.exe"),
        manifest_dir
            .parent()
            .ok_or_else(|| "Failed to resolve project root".to_string())?
            .join("helper_com_rs")
            .join("target")
            .join("release")
            .join("helper_com_rs.exe"),
    ];

    for candidate_path in candidate_paths {
        if candidate_path.exists() {
            return Ok(candidate_path);
        }
    }

    Err("helper_com_rs executable not found. Build it first.".to_string())
}

fn run_helper_command<T>(request: &HelperRequest) -> Result<T, String>
where
    T: for<'de> Deserialize<'de>,
{
    if std::env::consts::OS != "windows" {
        return Err("Outlook integration is only available on Windows.".to_string());
    }

    let helper_path = resolve_helper_path()?;
    let request_json = serde_json::to_string(request).map_err(|error| error.to_string())?;
    let mut child = Command::new(helper_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| error.to_string())?;

    let child_stdin = child
        .stdin
        .as_mut()
        .ok_or_else(|| "Failed to open helper_com_rs stdin".to_string())?;
    child_stdin
        .write_all(format!("{request_json}\n").as_bytes())
        .map_err(|error| error.to_string())?;

    let output = child
        .wait_with_output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if stderr.is_empty() {
            "helper_com_rs failed".to_string()
        } else {
            stderr
        });
    }

    let stdout = String::from_utf8(output.stdout).map_err(|error| error.to_string())?;
    let line = if stdout.trim().is_empty() {
        return Err("helper_com_rs returned no output".to_string());
    } else {
        stdout
            .lines()
            .find(|value| !value.trim().is_empty())
            .unwrap_or_default()
    };

    let response: HelperResponse<T> =
        serde_json::from_str(line).map_err(|error| error.to_string())?;
    if !response.success {
        return Err(response
            .error
            .unwrap_or_else(|| "helper_com_rs request failed".to_string()));
    }

    response
        .data
        .ok_or_else(|| "helper_com_rs returned no data".to_string())
}

fn fetch_inbox_service() -> Result<Vec<EmailMsg>, String> {
    run_helper_command(&HelperRequest::ListInbox {
        request_id: "mail_fetch_inbox".to_string(),
        max_results: 200,
    })
}

fn list_folders_service(
    state: &MailState,
    force_refresh: bool,
) -> Result<Vec<FolderOption>, String> {
    let mut folder_cache = state
        .folder_cache
        .lock()
        .map_err(|error| error.to_string())?;
    if !force_refresh && !folder_cache.is_empty() {
        return Ok(folder_cache.clone());
    }

    let folders: Vec<FolderOption> = run_helper_command(&HelperRequest::ListFolders {
        request_id: "mail_list_folders".to_string(),
        depth_max: 16,
        folder_count_max: 5000,
        top_level_only: false,
    })?;
    *folder_cache = folders.clone();
    Ok(folders)
}

fn get_recent_folders_service(state: &MailState) -> Result<Vec<String>, String> {
    let live_folders = list_folders_service(state, false)?;
    let live_folder_set = live_folders
        .iter()
        .map(|folder| folder.path.to_lowercase())
        .collect::<HashSet<_>>();

    Ok(load_recent_folders_file()?
        .into_iter()
        .filter(|folder_path| live_folder_set.contains(&folder_path.to_lowercase()))
        .collect())
}

fn get_marked_items_service() -> Result<Vec<MarkedItem>, String> {
    load_marked_items_file()
}

fn save_marked_items_service(items: Vec<MarkedItem>) -> Result<Vec<MarkedItem>, String> {
    save_marked_items_file(&items)
}

fn move_mail_service(
    state: &MailState,
    ids: Vec<String>,
    folder_path: String,
) -> Result<Vec<MoveResult>, String> {
    let results: Vec<MoveResult> = run_helper_command(&HelperRequest::MoveMessages {
        request_id: "mail_move".to_string(),
        ids,
        folder_path: normalize_path(&folder_path),
    })?;

    if results.iter().any(|result| result.success) {
        let recent_folders = load_recent_folders_file().unwrap_or_default();
        let mut next_folders = recent_folders;
        next_folders.push(folder_path);
        let _ = save_recent_folders_file(&next_folders);
    }

    let _ = state;
    Ok(results)
}

fn success<T>(data: T) -> CommandResponse<T> {
    CommandResponse {
        success: true,
        data: Some(data),
        error: None,
    }
}

fn failure<T>(error: String) -> CommandResponse<T> {
    CommandResponse {
        success: false,
        data: None,
        error: Some(error),
    }
}

#[tauri::command]
pub fn mail_fetch_inbox() -> CommandResponse<Vec<EmailMsg>> {
    match fetch_inbox_service() {
        Ok(data) => success(data),
        Err(error) => failure(error),
    }
}

#[tauri::command]
pub fn mail_list_folders(
    state: tauri::State<'_, MailState>,
    force_refresh: bool,
) -> CommandResponse<Vec<FolderOption>> {
    match list_folders_service(&state, force_refresh) {
        Ok(data) => success(data),
        Err(error) => failure(error),
    }
}

#[tauri::command]
pub fn mail_get_recent_folders(state: tauri::State<'_, MailState>) -> CommandResponse<Vec<String>> {
    match get_recent_folders_service(&state) {
        Ok(data) => success(data),
        Err(error) => failure(error),
    }
}

#[tauri::command]
pub fn mail_get_marked_items() -> CommandResponse<Vec<MarkedItem>> {
    match get_marked_items_service() {
        Ok(data) => success(data),
        Err(error) => failure(error),
    }
}

#[tauri::command]
pub fn mail_save_marked_items(items: Vec<MarkedItem>) -> CommandResponse<Vec<MarkedItem>> {
    match save_marked_items_service(items) {
        Ok(data) => success(data),
        Err(error) => failure(error),
    }
}

#[tauri::command]
pub fn mail_move(
    state: tauri::State<'_, MailState>,
    ids: Vec<String>,
    folder_path: String,
) -> CommandResponse<Vec<MoveResult>> {
    match move_mail_service(&state, ids, folder_path) {
        Ok(data) => success(data),
        Err(error) => failure(error),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_user_profile() -> PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time before epoch")
            .as_nanos()
            .to_string();
        std::env::temp_dir().join(format!("mado_mail_test_{suffix}"))
    }

    #[test]
    fn save_and_load_marked_items_round_trip() {
        let user_profile = unique_user_profile();
        std::env::set_var("USERPROFILE", &user_profile);

        let items = vec![MarkedItem {
            id: "1".to_string(),
            from: "Example Sender".to_string(),
            folder_path: "Inbox\\Processed".to_string(),
        }];

        let saved = save_marked_items_service(items).expect("save marked items");
        assert_eq!(saved.len(), 1);
        assert_eq!(saved[0].folder_path, "Inbox/Processed");

        let loaded = get_marked_items_service().expect("load marked items");
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].from, "Example Sender");
        assert_eq!(loaded[0].folder_path, "Inbox/Processed");
    }

    #[test]
    fn recent_folders_are_normalized_and_limited() {
        let user_profile = unique_user_profile();
        std::env::set_var("USERPROFILE", &user_profile);

        let values = vec![
            "zeta".to_string(),
            "Alpha".to_string(),
            "alpha".to_string(),
            "Inbox\\Beta".to_string(),
            "Gamma".to_string(),
            "Delta".to_string(),
            "Epsilon".to_string(),
            "Eta".to_string(),
            "Theta".to_string(),
            "Iota".to_string(),
        ];

        let saved = save_recent_folders_file(&values).expect("save recent folders");
        assert_eq!(saved.len(), 8);
        assert_eq!(saved[0], "Alpha");
        assert!(saved.iter().any(|value| value == "Inbox/Beta"));
        assert_eq!(
            saved
                .iter()
                .filter(|value| value.to_lowercase() == "alpha")
                .count(),
            1
        );
    }

    #[test]
    fn command_response_shape_is_stable_for_marked_items() {
        let user_profile = unique_user_profile();
        std::env::set_var("USERPROFILE", &user_profile);

        let response = mail_save_marked_items(vec![MarkedItem {
            id: "rule_1".to_string(),
            from: "alerts@example.com".to_string(),
            folder_path: "Inbox/Alerts".to_string(),
        }]);

        assert!(response.success);
        assert!(response.error.is_none());
        let data = response.data.expect("response data");
        assert_eq!(data.len(), 1);
        assert_eq!(data[0].id, "rule_1");
        assert_eq!(data[0].folder_path, "Inbox/Alerts");
    }
}
