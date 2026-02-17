use anyhow::{Result};
use tauri::State;
use tokio::sync::Mutex;
use crate::database_manager::database::{
    Database, BlocJson, PageJson, PropsJson
};

pub struct AppState {
    db: Mutex<Option<Database>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            db: Mutex::new(None),
        }
    }
}

const SUCCESS:i8 = 1;
const ERROR:i8 = -1;
const NO_CHANGE:i8 = 0;

#[tauri::command]
pub async fn init_db(state: State<'_, AppState>, db_path: String) -> Result<(), String> {
    let db = Database::new(&db_path).await.map_err(|e| e.to_string())?;

    *state.db.lock().await = Some(db);
    Ok(())
}

#[tauri::command]
pub async fn new_bloc(state: State<'_, AppState>, bloc: BlocJson) -> Result<String, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

    db.new_bloc(&bloc)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_bloc(state: State<'_, AppState>, bloc: BlocJson) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

    db.update_bloc(&bloc)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_bloc_content(state: State<'_, AppState>,
    id: String,
    new_content: String,
    updated_at: i64
) -> Result<i8, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

db.update_bloc_content(id, new_content, updated_at)
    .await
    .map_err(|e| e.to_string())
    .and_then(|status| {
        match status {
            Database::SUCCESS => Ok(SUCCESS),
            Database::NO_CHANGE => Ok(NO_CHANGE),
            _ => Ok(ERROR),
        }
    })
}

#[tauri::command]
pub async fn update_bloc_position(state: State<'_, AppState>,
    id: String,
    new_position: String,
    updated_at: i64
) -> Result<i8, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

    db.update_bloc_position(id, new_position, updated_at)
        .await
        .map_err(|e| e.to_string())
        .and_then(|status| {
            match status {
                Database::SUCCESS => Ok(SUCCESS),
                Database::NO_CHANGE => Ok(NO_CHANGE),
                _ => Ok(ERROR),
            }
        })
}

#[tauri::command]
pub async fn update_bloc_page_id(state: State<'_, AppState>, id: String, new_page_id: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

    db.update_bloc_page_id(id, new_page_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_bloc(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

    db.delete_bloc(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_bloc_by_page_id(state: State<'_, AppState>, page_id: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

    db.delete_bloc_by_page_id(page_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_checksum(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

    db.get_checksum(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_bloc_by_id(state: State<'_, AppState>, id: String) -> Result<BlocJson, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

    db.get_bloc_by_id(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_blocs_by_page_id(state: State<'_, AppState>, page_id: String) -> Result<Vec<BlocJson>, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Bloc structure not initialized".to_string())?;

    db.get_blocs_by_page_id(page_id)
        .await
        .map_err(|e| e.to_string())
}


// remember to call `.manage(MyState::default())`
#[tauri::command]
pub async fn new_page(state: tauri::State<'_, AppState>, page: PageJson) -> Result<String, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Page structure not initialized".to_string())?;

    db.new_page(&page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_page(state: tauri::State<'_, AppState>, page: PageJson) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Page structure not initialized".to_string())?;

    db.update_page(&page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_page_path(state: tauri::State<'_, AppState>, id: String, path: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Page structure not initialized".to_string())?;

    db.update_page_path(id, path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_page_title(state: tauri::State<'_, AppState>, id: String, title: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Page structure not initialized".to_string())?;

    db.update_page_title(id, title)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_page_cache(state: tauri::State<'_, AppState>, id: String, cache: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Page structure not initialized".to_string())?;

    db.update_page_cache(id, cache)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_page_cache(state: tauri::State<'_, AppState>, id: String) -> Result<String, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Page structure not initialized".to_string())?;

    db.get_page_cache(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_page_updated_at(state: tauri::State<'_, AppState>, id: String, updated_at: i64) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Page structure not initialized".to_string())?;

    db.update_page_updated_at(id, updated_at)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_page(state: tauri::State<'_, AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Page structure not initialized".to_string())?;

    db.delete_page(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_pages_by_path(state: tauri::State<'_, AppState>, path: String) -> Result<Vec<PageJson>, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Page structure not initialized".to_string())?;

    db.get_pages_by_path(path)
        .await
        .map_err(|e| e.to_string())
}


#[tauri::command]
pub async fn new_prop(state: tauri::State<'_, AppState>, prop: PropsJson) -> Result<String, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Prop structure not initialized".to_string())?;

    db.new_prop(&prop)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_prop_value(state: tauri::State<'_, AppState>, bloc_id: String, key: String, value: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Prop structure not initialized".to_string())?;

    db.update_prop_value(bloc_id, key, value)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_prop(state: tauri::State<'_, AppState>, bloc_id: String, key: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Prop structure not initialized".to_string())?;

    db.delete_prop(bloc_id, key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_prop_by_bloc_id(state: tauri::State<'_, AppState>, bloc_id: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Prop structure not initialized".to_string())?;

    db.delete_prop_by_bloc_id(bloc_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_props_by_bloc_id(state: tauri::State<'_, AppState>, bloc_id: String) -> Result<Vec<PropsJson>, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Prop structure not initialized".to_string())?;

    db.get_props_by_bloc_id(bloc_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_props_by_key(state: tauri::State<'_, AppState>, key: String) -> Result<Vec<PropsJson>, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Prop structure not initialized".to_string())?;

    db.get_props_by_key(key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn change_prop_key_name(state: tauri::State<'_, AppState>, key: String, new_key: String) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or_else(|| "Prop structure not initialized".to_string())?;

    db.change_prop_key_name(key, new_key)
        .await
        .map_err(|e| e.to_string())
}
