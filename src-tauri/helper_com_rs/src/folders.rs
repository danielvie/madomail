use anyhow::Context;
use serde::Serialize;
use windows::Win32::System::Com::IDispatch;

use crate::dispatch::{Arg, as_dispatch, as_i32, as_string, call_method, get_property};

#[derive(Debug, Serialize, Clone)]
pub struct FolderInfo {
    pub name: String,
    pub path: String,
}

pub fn list_folders(
    app: &IDispatch,
    depth_max: u32,
    folder_count_max: usize,
    top_level_only: bool,
) -> anyhow::Result<Vec<FolderInfo>> {
    let ns_v = call_method(app, "GetNamespace", vec![Arg::Str("MAPI".to_string())])
        .context("Application.GetNamespace('MAPI') failed")?;
    let ns = as_dispatch(&ns_v)?;

    let store_v = get_property(&ns, "DefaultStore").context("Session.DefaultStore failed")?;
    let store = as_dispatch(&store_v).context("DefaultStore not IDispatch")?;

    let root_v =
        call_method(&store, "GetRootFolder", vec![]).context("Store.GetRootFolder failed")?;
    let root = as_dispatch(&root_v).context("RootFolder not IDispatch")?;

    if top_level_only {
        return list_top_level_children(&root, folder_count_max);
    }

    let mut out = Vec::new();
    walk_children(&root, "", 0, depth_max, folder_count_max, &mut out)
        .context("walk_children failed")?;
    Ok(out)
}

fn list_top_level_children(
    root: &IDispatch,
    folder_count_max: usize,
) -> anyhow::Result<Vec<FolderInfo>> {
    let folders_v = get_property(root, "Folders").context("Folder.Folders failed")?;
    let folders = as_dispatch(&folders_v).context("Folders not IDispatch")?;

    let count_v = get_property(&folders, "Count").context("Folders.Count failed")?;
    let count_i: i32 = as_i32(&count_v).unwrap_or(0);

    let mut out = Vec::new();
    for item_index in 1..=count_i {
        if folder_count_max > 0 && out.len() >= folder_count_max {
            break;
        }

        let child_v = match call_method(&folders, "Item", vec![Arg::I32(item_index)]) {
            Ok(value) => value,
            Err(_) => continue,
        };
        let child = match as_dispatch(&child_v) {
            Ok(dispatch) => dispatch,
            Err(_) => continue,
        };

        let name = get_property(&child, "Name")
            .and_then(|value| as_string(&value))
            .unwrap_or_default();
        if name.is_empty() {
            continue;
        }

        out.push(FolderInfo {
            name: name.clone(),
            path: name,
        });
    }

    Ok(out)
}

fn walk_children(
    folder: &IDispatch,
    current_path: &str,
    depth: u32,
    depth_max: u32,
    folder_count_max: usize,
    out: &mut Vec<FolderInfo>,
) -> anyhow::Result<()> {
    if depth > depth_max {
        return Ok(());
    }
    if folder_count_max > 0 && out.len() >= folder_count_max {
        return Ok(());
    }

    let folders_v = get_property(folder, "Folders").context("Folder.Folders failed")?;
    let folders = as_dispatch(&folders_v).context("Folders not IDispatch")?;

    let count_v = get_property(&folders, "Count").context("Folders.Count failed")?;
    let count_i: i32 = as_i32(&count_v).unwrap_or(0);

    for item_index in 1..=count_i {
        if folder_count_max > 0 && out.len() >= folder_count_max {
            break;
        }

        let child_v = match call_method(&folders, "Item", vec![Arg::I32(item_index)]) {
            Ok(value) => value,
            Err(_) => continue,
        };
        let child = match as_dispatch(&child_v) {
            Ok(dispatch) => dispatch,
            Err(_) => continue,
        };

        let name = get_property(&child, "Name")
            .and_then(|value| as_string(&value))
            .unwrap_or_default();
        if name.is_empty() {
            continue;
        }

        let path = if current_path.is_empty() {
            name.clone()
        } else {
            format!("{}/{}", current_path, name)
        };

        out.push(FolderInfo {
            name,
            path: path.clone(),
        });

        walk_children(&child, &path, depth + 1, depth_max, folder_count_max, out)?;
    }

    Ok(())
}
