use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

struct ServerProcess(Mutex<Option<Child>>);

impl Drop for ServerProcess {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.0.lock() {
            if let Some(ref mut child) = *guard {
                let _ = child.kill();
                log::info!("Server process stopped");
            }
        }
    }
}

fn is_server_running() -> bool {
    std::net::TcpStream::connect("127.0.0.1:3001").is_ok()
}

fn wait_for_server() -> bool {
    for _ in 0..20 {
        if is_server_running() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(500));
    }
    false
}

#[cfg(target_os = "windows")]
fn hide_console(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(target_os = "windows"))]
fn hide_console(_cmd: &mut Command) {}

fn spawn_server(_app: &tauri::AppHandle) -> Option<Child> {
    if is_server_running() {
        log::info!("Server already running on port 3001 (dev mode)");
        return None;
    }

    let mut search_paths: Vec<std::path::PathBuf> = Vec::new();

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            search_paths.push(exe_dir.join("dist-server").join("index.js"));
            // Tauri bundles ../ resources under _up_/ relative to exe
            search_paths.push(exe_dir.join("_up_").join("dist-server").join("index.js"));
        }
    }

    search_paths.push(std::path::PathBuf::from("dist-server/index.js"));
    search_paths.push(std::path::PathBuf::from("../dist-server/index.js"));

    for server_js in &search_paths {
        log::info!("Looking for server at: {:?}", server_js);
        if server_js.exists() {
            log::info!("Starting server from: {:?}", server_js);
            let mut cmd = Command::new("node");
            cmd.arg(server_js).env("TAURI", "1");
            hide_console(&mut cmd);
            let child = cmd.spawn().ok();
            if child.is_some() {
                log::info!("Waiting for server to be ready...");
                if wait_for_server() {
                    log::info!("Server ready on port 3001");
                } else {
                    log::error!("Server failed to start within 10 seconds");
                }
            }
            return child;
        }
    }

    log::error!("Server JS not found. Checked: {:?}", search_paths);
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .setup(|app| {
            let child = spawn_server(&app.handle());
            app.manage(ServerProcess(Mutex::new(child)));

            // Create window pointing directly to the Express server
            tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::External(
                    "http://localhost:3001".parse().unwrap(),
                ),
            )
            .title("Claude Code History")
            .inner_size(1200.0, 800.0)
            .min_inner_size(800.0, 500.0)
            .resizable(true)
            .fullscreen(false)
            .center()
            .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
