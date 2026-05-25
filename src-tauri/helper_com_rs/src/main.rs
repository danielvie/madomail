mod dispatch;
mod folders;
mod outlook;
mod variant_date;

use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead, Write};
use std::sync::mpsc;
use std::thread;
use windows::Win32::System::Com::{
    CLSCTX_LOCAL_SERVER, COINIT_APARTMENTTHREADED, CoCreateInstance, CoInitializeEx,
    CoUninitialize, IDispatch,
};

#[derive(Debug, Deserialize)]
#[serde(tag = "command", rename_all = "snake_case")]
enum RequestPayload {
    ListInbox {
        max_results: Option<u32>,
    },
    ListFolders {
        depth_max: Option<u32>,
        folder_count_max: Option<usize>,
        top_level_only: Option<bool>,
    },
    MoveMessages {
        ids: Vec<String>,
        folder_path: String,
    },
}

#[derive(Debug, Deserialize)]
struct RequestEnvelope {
    request_id: Option<String>,
    #[serde(flatten)]
    payload: RequestPayload,
}

#[derive(Debug, Serialize)]
struct ResponseEnvelope<T: Serialize> {
    request_id: Option<String>,
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

enum WorkerRequest {
    ListInbox {
        max_results: u32,
    },
    ListFolders {
        depth_max: u32,
        folder_count_max: usize,
        top_level_only: bool,
    },
    MoveMessages {
        ids: Vec<String>,
        folder_path: String,
    },
}

struct ComGuard;

impl Drop for ComGuard {
    fn drop(&mut self) {
        unsafe { CoUninitialize() };
    }
}

fn init_com() -> anyhow::Result<ComGuard> {
    unsafe {
        CoInitializeEx(None, COINIT_APARTMENTTHREADED).ok()?;
    }
    Ok(ComGuard)
}

fn connect_outlook() -> anyhow::Result<IDispatch> {
    unsafe {
        let dispatch: IDispatch = CoCreateInstance(
            &windows::core::GUID::from_u128(0x0006f03a_0000_0000_c000_000000000046),
            None,
            CLSCTX_LOCAL_SERVER,
        )
        .context("CoCreateInstance(Outlook.Application) failed")?;
        Ok(dispatch)
    }
}

fn start_worker() -> mpsc::Sender<(
    WorkerRequest,
    mpsc::Sender<anyhow::Result<serde_json::Value>>,
)> {
    let (tx, rx) = mpsc::channel::<(
        WorkerRequest,
        mpsc::Sender<anyhow::Result<serde_json::Value>>,
    )>();

    thread::spawn(move || {
        let _com_guard = match init_com() {
            Ok(guard) => guard,
            Err(_) => return,
        };

        let app = match connect_outlook() {
            Ok(app) => app,
            Err(_) => return,
        };

        while let Ok((request, reply_tx)) = rx.recv() {
            let response: anyhow::Result<serde_json::Value> = (|| match request {
                WorkerRequest::ListInbox { max_results } => {
                    let items =
                        outlook::get_inbox_items(&app, max_results).context("list_inbox failed")?;
                    serde_json::to_value(items).context("Serialize list_inbox response failed")
                }
                WorkerRequest::ListFolders {
                    depth_max,
                    folder_count_max,
                    top_level_only,
                } => {
                    let folders =
                        folders::list_folders(&app, depth_max, folder_count_max, top_level_only)
                            .context("list_folders failed")?;
                    serde_json::to_value(folders).context("Serialize list_folders response failed")
                }
                WorkerRequest::MoveMessages { ids, folder_path } => {
                    let results = outlook::move_mail_by_entry_id(&app, &ids, &folder_path)
                        .context("move_messages failed")?;
                    serde_json::to_value(results).context("Serialize move_messages response failed")
                }
            })();

            let _ = reply_tx.send(response);
        }
    });

    tx
}

fn main() {
    let worker_tx = start_worker();
    let stdin = io::stdin();
    let mut stdout = io::stdout();

    for line_result in stdin.lock().lines() {
        let line = match line_result {
            Ok(line) if !line.trim().is_empty() => line,
            Ok(_) => continue,
            Err(error) => {
                let response = ResponseEnvelope::<serde_json::Value> {
                    request_id: None,
                    success: false,
                    data: None,
                    error: Some(format!("Failed to read request line: {}", error)),
                };
                let _ = serde_json::to_writer(&mut stdout, &response);
                let _ = stdout.write_all(b"\n");
                let _ = stdout.flush();
                continue;
            }
        };

        let envelope: RequestEnvelope = match serde_json::from_str(&line) {
            Ok(envelope) => envelope,
            Err(error) => {
                let response = ResponseEnvelope::<serde_json::Value> {
                    request_id: None,
                    success: false,
                    data: None,
                    error: Some(format!("Failed to parse request JSON: {}", error)),
                };
                let _ = serde_json::to_writer(&mut stdout, &response);
                let _ = stdout.write_all(b"\n");
                let _ = stdout.flush();
                continue;
            }
        };

        let request = match envelope.payload {
            RequestPayload::ListInbox { max_results } => WorkerRequest::ListInbox {
                max_results: max_results.unwrap_or(200),
            },
            RequestPayload::ListFolders {
                depth_max,
                folder_count_max,
                top_level_only,
            } => WorkerRequest::ListFolders {
                depth_max: depth_max.unwrap_or(1),
                folder_count_max: folder_count_max.unwrap_or(50),
                top_level_only: top_level_only.unwrap_or(true),
            },
            RequestPayload::MoveMessages { ids, folder_path } => {
                WorkerRequest::MoveMessages { ids, folder_path }
            }
        };

        let (reply_tx, reply_rx) = mpsc::channel();
        let response = if worker_tx.send((request, reply_tx)).is_err() {
            ResponseEnvelope::<serde_json::Value> {
                request_id: envelope.request_id,
                success: false,
                data: None,
                error: Some("COM worker is not available".to_string()),
            }
        } else {
            match reply_rx.recv() {
                Ok(Ok(data)) => ResponseEnvelope {
                    request_id: envelope.request_id,
                    success: true,
                    data: Some(data),
                    error: None,
                },
                Ok(Err(error)) => ResponseEnvelope::<serde_json::Value> {
                    request_id: envelope.request_id,
                    success: false,
                    data: None,
                    error: Some(error.to_string()),
                },
                Err(error) => ResponseEnvelope::<serde_json::Value> {
                    request_id: envelope.request_id,
                    success: false,
                    data: None,
                    error: Some(format!("Failed to receive worker response: {}", error)),
                },
            }
        };

        let _ = serde_json::to_writer(&mut stdout, &response);
        let _ = stdout.write_all(b"\n");
        let _ = stdout.flush();
    }
}
