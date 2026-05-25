use anyhow::Context;
use serde::Serialize;
use windows::Win32::System::Com::IDispatch;

use crate::dispatch::{Arg, as_dispatch, as_i32, as_string, call_method, get_property};

const OL_FOLDER_INBOX: i32 = 6;

#[derive(Debug, Serialize, Clone)]
pub struct MailHeader {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: String,
    pub from: String,
    #[serde(rename = "senderMatch")]
    pub sender_match: String,
    pub subject: String,
    pub snippet: String,
    pub date: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct MoveResult {
    pub id: String,
    pub success: bool,
    pub error: Option<String>,
}

pub fn get_inbox_items(app: &IDispatch, max_results: u32) -> anyhow::Result<Vec<MailHeader>> {
    let ns_v = call_method(app, "GetNamespace", vec![Arg::Str("MAPI".to_string())])
        .context("Application.GetNamespace('MAPI') failed")?;
    let ns = as_dispatch(&ns_v).context("GetNamespace result not IDispatch")?;

    let inbox_v = call_method(&ns, "GetDefaultFolder", vec![Arg::I32(OL_FOLDER_INBOX)])
        .context("Namespace.GetDefaultFolder(olFolderInbox) failed")?;
    let inbox = as_dispatch(&inbox_v).context("Inbox folder not IDispatch")?;

    let items_v = get_property(&inbox, "Items").context("Inbox.Items failed")?;
    let items = as_dispatch(&items_v).context("Items not IDispatch")?;

    let count_v = get_property(&items, "Count").context("Items.Count failed")?;
    let count_i: i32 = as_i32(&count_v).unwrap_or(0);

    let take = (max_results as i32).min(count_i).max(0);
    let mut out = Vec::new();

    for item_index in 1..=take {
        let item_v = match call_method(&items, "Item", vec![Arg::I32(item_index)]) {
            Ok(value) => value,
            Err(_) => continue,
        };
        let item = match as_dispatch(&item_v) {
            Ok(dispatch) => dispatch,
            Err(_) => continue,
        };

        let id = match get_property(&item, "EntryID").and_then(|value| as_string(&value)) {
            Ok(value) if !value.is_empty() => value,
            _ => continue,
        };

        let sender_name = get_property(&item, "SenderName")
            .and_then(|value| as_string(&value))
            .unwrap_or_default();
        let sender_email = get_property(&item, "SenderEmailAddress")
            .and_then(|value| as_string(&value))
            .unwrap_or_default();
        let sender_match = match (sender_name.is_empty(), sender_email.is_empty()) {
            (false, false) => format!("{} <{}>", sender_name, sender_email),
            (false, true) => sender_name,
            (true, false) => sender_email,
            (true, true) => "Unknown Sender".to_string(),
        };

        let subject = get_property(&item, "Subject")
            .and_then(|value| as_string(&value))
            .unwrap_or_default();
        let body = get_property(&item, "Body")
            .and_then(|value| as_string(&value))
            .unwrap_or_default();
        let snippet = body.split_whitespace().collect::<Vec<_>>().join(" ");
        let snippet = if snippet.len() > 240 {
            snippet[..240].to_string()
        } else {
            snippet
        };

        let date = match get_property(&item, "ReceivedTime") {
            Ok(value) => crate::variant_date::variant_date_to_iso8601(&value).unwrap_or_default(),
            Err(_) => String::new(),
        };

        out.push(MailHeader {
            id: id.clone(),
            thread_id: id,
            from: sender_match.clone(),
            sender_match,
            subject,
            snippet,
            date,
        });
    }

    Ok(out)
}

pub fn move_mail_by_entry_id(
    app: &IDispatch,
    ids: &[String],
    folder_path: &str,
) -> anyhow::Result<Vec<MoveResult>> {
    let ns_v = call_method(app, "GetNamespace", vec![Arg::Str("MAPI".to_string())])
        .context("Application.GetNamespace('MAPI') failed")?;
    let ns = as_dispatch(&ns_v)?;

    let store_v = get_property(&ns, "DefaultStore").context("Session.DefaultStore failed")?;
    let store = as_dispatch(&store_v).context("DefaultStore not IDispatch")?;

    let root_v =
        call_method(&store, "GetRootFolder", vec![]).context("Store.GetRootFolder failed")?;
    let root = as_dispatch(&root_v).context("RootFolder not IDispatch")?;

    let mut target_folder = root;
    let parts: Vec<&str> = folder_path
        .split(|c| c == '/' || c == '\\')
        .filter(|p| !p.is_empty())
        .collect();

    for name in parts {
        let folders_v = get_property(&target_folder, "Folders").context("Folder.Folders failed")?;
        let folders = as_dispatch(&folders_v).context("Folders not IDispatch")?;
        let next_v = call_method(&folders, "Item", vec![Arg::Str(name.to_string())])
            .with_context(|| format!("Folders.Item('{name}') failed"))?;
        target_folder =
            as_dispatch(&next_v).with_context(|| format!("Folder '{name}' not IDispatch"))?;
    }

    let mut results = Vec::new();
    for id in ids {
        let item_v = match call_method(&ns, "GetItemFromID", vec![Arg::Str(id.clone())]) {
            Ok(value) => value,
            Err(error) => {
                results.push(MoveResult {
                    id: id.clone(),
                    success: false,
                    error: Some(error.to_string()),
                });
                continue;
            }
        };

        let item = match as_dispatch(&item_v) {
            Ok(dispatch) => dispatch,
            Err(error) => {
                results.push(MoveResult {
                    id: id.clone(),
                    success: false,
                    error: Some(error.to_string()),
                });
                continue;
            }
        };

        match call_method(&item, "Move", vec![Arg::Dispatch(target_folder.clone())]) {
            Ok(_) => results.push(MoveResult {
                id: id.clone(),
                success: true,
                error: None,
            }),
            Err(error) => results.push(MoveResult {
                id: id.clone(),
                success: false,
                error: Some(error.to_string()),
            }),
        }
    }

    Ok(results)
}
