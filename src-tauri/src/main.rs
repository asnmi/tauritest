// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod database_manager;

use std::{fs, path::PathBuf};
use rfd::FileDialog;
use database_manager::database_tauri::{
    AppState,
    init_db,

    new_bloc,
    update_bloc,
    update_bloc_content,
    update_bloc_position,
    update_bloc_page_id,
    delete_bloc,
    delete_bloc_by_page_id,
    get_checksum,
    get_bloc_by_id,
    get_blocs_by_page_id,

    new_page,
    update_page,
    update_page_path,
    update_page_title,
    update_page_cache,
    get_page_cache,
    update_page_updated_at,
    delete_page,
    get_pages_by_path,

    new_prop,
    update_prop_value,
    delete_prop,
    delete_prop_by_bloc_id,
    get_props_by_bloc_id,
    get_props_by_key,
    change_prop_key_name
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn write_file(path: String, contents: String) -> Result<(), String> {
    use std::fs;
use std::path::Path;
    
    // Créer le dossier parent s'il n'existe pas
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    // Écrire le fichier
    fs::write(&path, contents).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn open_file_dialog() -> String {
    let dir = PathBuf::from("/");
    let file_dialog_res = FileDialog::new().set_directory(dir).pick_file();

    if let Some(file_handle) = file_dialog_res {
        let path = Some(file_handle.to_str().unwrap().to_string());
        return path.unwrap();
    }else{
        return "".to_string();
    }
}

#[tauri::command]
fn read_file(path: String) -> String {
    return fs::read_to_string(PathBuf::from(path)).unwrap();
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            write_file,
            open_file_dialog,
            read_file,

            init_db,

            new_bloc,
            update_bloc,
            update_bloc_content,
            update_bloc_position,
            update_bloc_page_id,
            delete_bloc,
            delete_bloc_by_page_id,
            get_checksum,
            get_bloc_by_id,
            get_blocs_by_page_id,

            new_page,
            update_page,
            update_page_path,
            update_page_title,
            update_page_cache,
            get_page_cache,
            update_page_updated_at,
            delete_page,
            get_pages_by_path,

            new_prop,
            update_prop_value,
            delete_prop,
            delete_prop_by_bloc_id,
            get_props_by_bloc_id,
            get_props_by_key,
            change_prop_key_name
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
