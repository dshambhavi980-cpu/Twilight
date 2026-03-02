#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {
      // The deep-link feature on single-instance automatically forwards
      // deep link URLs to the running instance via onOpenUrl events.
    }))
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_process::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Register the deep link scheme on desktop so the OS knows to route
      // twilight-garden:// URLs back to this application.
      #[cfg(desktop)]
      {
        use tauri_plugin_deep_link::DeepLinkExt;
        app.deep_link().register("twilight-garden").unwrap_or_else(|e| {
          eprintln!("Failed to register deep link scheme: {}", e);
        });
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
