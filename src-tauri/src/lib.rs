mod mail;

use mail::MailState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(MailState::default())
        .invoke_handler(tauri::generate_handler![
            mail::mail_fetch_inbox,
            mail::mail_list_folders,
            mail::mail_get_recent_folders,
            mail::mail_get_marked_items,
            mail::mail_save_marked_items,
            mail::mail_move,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
