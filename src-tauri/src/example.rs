use tauri::State;
use tokio::sync::Mutex;
use crate::database_manager::database::{Database, JsonDocument};
use serde_json::Value as JsonValue;

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

/*#[tauri::command]
pub async fn create_example_data(
    state: State<'_, AppState>,
    examples: Vec<(String, String)>,
) -> Result<(), String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;

    db.create_example_data(examples)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn init_db(state: State<'_, AppState>, db_path: String) -> Result<(), String> {
    let db = Database::new(&db_path).await.map_err(|e| e.to_string())?;

    *state.db.lock().await = Some(db);
    Ok(())
}*/

#[tauri::command]
pub async fn insert_document(
    state: State<'_, AppState>,
    collection: String,
    data: JsonValue,
) -> Result<i64, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;

    let doc = JsonDocument {
        id: None,
        collection,
        data,
    };

    db.insert(&doc).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_document(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Option<JsonDocument>, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;

    db.get_by_id(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_document(
    state: State<'_, AppState>,
    id: i64,
    collection: String,
    data: JsonValue,
) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;

    let doc = JsonDocument {
        id: Some(id),
        collection,
        data,
    };

    db.update(id, &doc).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_document(state: State<'_, AppState>, id: i64) -> Result<bool, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;

    db.delete(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_collection(
    state: State<'_, AppState>,
    collection: String,
) -> Result<Vec<JsonDocument>, String> {
    let db = state.db.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;

    db.get_by_collection(&collection)
        .await
        .map_err(|e| e.to_string())
}

/*#[tauri::command]
pub async fn export_page(&self, page_id: i64) -> Result<serde_json::Value> {
    use serde_json::{json, Value};
    use chrono::{DateTime, Utc};

    // Récupérer les informations de la page
    let page = sqlx::query_as::<_, PageJson>(
        "SELECT id, path, title, '' as cache, created_at, updated_at 
        FROM pages 
        WHERE id = ?"
    )
    .bind(page_id)
    .fetch_one(&self.pool)
    .await?;

    // Récupérer tous les blocs de la page
    let blocs = self.get_bloc_by_page_id(page_id).await?;

    // Construire la structure des blocs
    let mut blocks_array = Vec::new();
    for bloc in blocs {
        if let Ok(mut block_value) = serde_json::from_str::<Value>(&bloc.content) {
            // S'assurer que la structure du bloc correspond au format attendu
            if let Some(block_obj) = block_value.as_object_mut() {
                // Ajouter les champs manquants s'ils n'existent pas
                block_obj.entry("direction").or_insert(Value::Null);
                block_obj.entry("format").or_insert(Value::String("".to_string()));
                block_obj.entry("indent").or_insert(Value::Number(0.into()));
                block_obj.entry("version").or_insert(Value::Number(1.into()));
                
                // S'assurer que les enfants sont un tableau
                if !block_obj.contains_key("children") {
                    block_obj.insert("children".to_string(), Value::Array(Vec::new()));
                }
            }
            blocks_array.push(block_value);
        }
    }

    // Obtenir le timestamp en millisecondes
    let last_modified = DateTime::from_timestamp(page.updated_at, 0)
        .unwrap_or_else(|| DateTime::<Utc>::MIN_UTC)
        .timestamp_millis();

    // Construire le JSON final
    let result = json!({
        "id": page.id.map(|id| id.to_string()).unwrap_or_default(),
        "title": page.title,
        "filePath": page.path,
        "lastModified": last_modified,
        "editorState": {
            "root": {
                "children": blocks_array,
                "direction": Value::Null,
                "format": "",
                "indent": 0,
                "type": "root",
                "version": 1
            }
        }
    });

    Ok(result)
}

#[tauri::command]
pub async fn import_page(&self, json_data: &str, date_now: i64) -> Result<i64> {
        use serde_json::Value;

        // Parser le JSON
        let data: Value = serde_json::from_str(json_data)?;

        // Créer la page
        let page = PageJson {
            id: None,
            path: data["filePath"].as_str().unwrap_or("").to_string(),
            title: data["title"].as_str().unwrap_or("Untitled").to_string(),
            cache: "".to_string(),
            created_at: date_now,
            updated_at: date_now,
        };

        // Insérer la page
        let page_id = PageStructure::new(self.pool.clone());

        // Vérifier si editorState existe
        if let Some(editor_state) = data.get("editorState") {
            if let Some(root) = editor_state.get("root") {
                if let Some(blocks) = root.get("children") {
                    if let Some(blocks_array) = blocks.as_array() {
                        // Parcourir chaque bloc
                        for (index, block) in blocks_array.iter().enumerate() {
                            if let Some(block_type) = block.get("type").and_then(|t| t.as_str()) {
                                let block_json = serde_json::to_string(block)?;
                                let checksum = format!("{:x}", md5::compute(&block_json));

                                let bloc = BlocJson {
                                    id: None,
                                    position: index as i64,
                                    content: block_json,
                                    checksum,
                                    page_id,
                                    bloc_type: block_type.to_string(),
                                    created_at: date_now,
                                    updated_at: date_now,
                                };

                                // Insérer le bloc
                                let _ = self.new_bloc(&bloc).await?;
                            }
                        }
                    }
                }
            }
        }

        Ok(page_id)
    }*/

/*#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::tempdir;

    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct TestData {
        name: String,
        value: i32,
    }

    async fn create_test_db() -> (tempfile::TempDir, Database) {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::new(db_path.to_str().unwrap())
            .await
            .expect("Failed to create test database");
        (dir, db)
    }

    #[tokio::test]
    async fn test_crud_operations() {
        let (_dir, db) = create_test_db().await;

        // Test d'insertion
        let doc = JsonDocument {
            id: None,
            collection: "test".to_string(),
            data: json!({ "name": "test", "value": 42 }),
        };

        let id = db.insert(&doc).await.unwrap();
        assert!(id > 0);

        // Test de récupération
        let retrieved = db.get_by_id(id).await.unwrap().unwrap();
        assert_eq!(retrieved.data["name"], "test");

        // Test de mise à jour
        let mut updated_doc = doc;
        updated_doc.data = json!({ "name": "updated", "value": 100 });
        let updated = db.update(id, &updated_doc).await.unwrap();
        assert!(updated);

        // Test de suppression
        let deleted = db.delete(id).await.unwrap();
        assert!(deleted);

        // Vérification de la suppression
        let should_be_none = db.get_by_id(id).await.unwrap();
        assert!(should_be_none.is_none());
    }

    #[tokio::test]
    async fn test_query_by_collection() {
        let (_dir, db) = create_test_db().await;

        // Insérer plusieurs documents dans la même collection
        let docs = vec![
            JsonDocument {
                id: None,
                collection: "test_query".to_string(),
                data: json!({ "name": "doc1", "value": 1 }),
            },
            JsonDocument {
                id: None,
                collection: "test_query".to_string(),
                data: json!({ "name": "doc2", "value": 2 }),
            },
            JsonDocument {
                id: None,
                collection: "other_collection".to_string(),
                data: json!({ "name": "doc3", "value": 3 }),
            },
        ];

        for doc in &docs {
            db.insert(doc).await.unwrap();
        }

        // Tester la récupération par collection
        let results = db.get_by_collection("test_query").await.unwrap();
        assert_eq!(results.len(), 2);

        // Tester la recherche avec json_extract
        let results: Vec<TestData> = db.query("test_query", "$.name", "\"doc1\"").await.unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].name, "doc1");
    }
}*/
