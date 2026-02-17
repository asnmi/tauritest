use anyhow::{Ok, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Row, Sqlite};
use std::path::Path;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

// Structure pour représenter un document JSON dans la base de données
#[derive(Debug, Serialize, Deserialize)]
pub struct JsonDocument {
    pub id: Option<i64>,
    pub collection: String,
    pub data: JsonValue,
}

#[derive(sqlx::FromRow, serde::Deserialize, serde::Serialize)]
pub struct PageJson {
    pub id: Option<String>,
    pub path: String,
    pub title: String,
    pub cache: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(sqlx::FromRow, serde::Deserialize, serde::Serialize)]
pub struct BlocJson {
    pub id: Option<String>,
    pub position: String,
    pub content: String,
    pub page_id: String,
    pub bloc_type: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(sqlx::FromRow, serde::Deserialize, serde::Serialize)]
pub struct PropsJson {
    pub id: Option<String>,
    pub key: String,
    pub value: String,
    pub bloc_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: i64,
    pub collection: String,
    pub data: JsonValue,
    pub score: Option<f64>,
}
pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    pub const SUCCESS:i8 = 1;
    pub const ERROR:i8 = -1;
    pub const NO_CHANGE:i8 = 0;

    // Initialise une nouvelle connexion à la base de données SQLite
    pub async fn new(db_path: &str) -> Result<Self> {
        let db_path = Path::new(db_path);

        // Crée le répertoire parent si nécessaire
        if let Some(parent) = db_path.parent() {
            if !parent.exists() {
                std::fs::create_dir_all(parent)?;
            }
        }

        // Crée le fichier s'il n'existe pas
        if !db_path.exists() {
            std::fs::File::create(db_path)?;
        }

        let database_url = format!("sqlite:{}", db_path.display());
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await?;

        // Crée la table si elle n'existe pas
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS pages (
                id TEXT NOT NULL,
                path TEXT NOT NULL,
                title TEXT NOT NULL,
                cache TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )"#,
        )
        .execute(&pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS blocs (
                id TEXT NOT NULL,
                position TEXT NOT NULL,
                content TEXT NOT NULL,
                checksum TEXT NOT NULL,
                page_id TEXT NOT NULL,
                bloc_type TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )"#,
        )
        .execute(&pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS props (
                id TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                bloc_id TEXT NOT NULL
            )"#,
        )
        .execute(&pool)
        .await?;

        // Création de la table si elle n'existe pas
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS bloc (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL
            )
            "#,
        )
        .execute(&pool)
        .await?;

        // Crée un index sur la colonne collection pour de meilleures performances
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_title ON pages(title)")
            .execute(&pool)
            .await?;

        Ok(Database { pool })
    }

    // new bloc
    pub async fn new_bloc(&self, bloc_json: &BlocJson) -> Result<String> {
        let mut hasher = DefaultHasher::new();
        bloc_json.content.hash(&mut hasher);
        let checksum = hasher.finish().to_string();
        
        let id = sqlx::query(
            "INSERT INTO blocs (id, position, content, checksum, page_id, bloc_type, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
            RETURNING id")
            .bind(&bloc_json.id)
            .bind(&bloc_json.position)
            .bind(&bloc_json.content)
            .bind(checksum)
            .bind(&bloc_json.page_id)
            .bind(&bloc_json.bloc_type)
            .bind(&bloc_json.created_at)
            .bind(&bloc_json.updated_at)
            .fetch_one(&self.pool)
            .await?
            .get(0);
        Ok(id)
    }

    // use when a content was edited, call on bloc lose focus
    pub async fn update_bloc(&self, bloc_json: &BlocJson) -> Result<bool> {
        let mut hasher = DefaultHasher::new();
        bloc_json.content.hash(&mut hasher);
        let checksum = hasher.finish().to_string();
        
        let rows_affected = sqlx::query(
            "UPDATE blocs SET position = ?, content = ?, checksum = ?, bloc_type = ?, updated_at = ? 
            WHERE id = ?",
        )
        .bind(&bloc_json.position)
        .bind(&bloc_json.content)
        .bind(&checksum)
        .bind(&bloc_json.bloc_type)
        .bind(&bloc_json.updated_at)
        .bind(&bloc_json.id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }
    
    pub async fn update_bloc_content(
        &self,
        id: String,
        new_content: String,
        updated_at: i64,
    ) -> Result<i8> {
        let current_checksum = self.get_checksum(id.clone()).await?;
        
        let mut hasher = DefaultHasher::new();
        new_content.hash(&mut hasher);
        let new_checksum = hasher.finish().to_string();
        
        if current_checksum == new_checksum {
            return Ok(Self::NO_CHANGE);
        }

        let rows_affected = sqlx::query(
            "UPDATE blocs SET content = ?, checksum = ?, updated_at = ? 
            WHERE id = ?",
        )
        .bind(&new_content)
        .bind(&new_checksum)
        .bind(updated_at)
        .bind(&id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        if rows_affected > 0 {
            Ok(Self::SUCCESS)
        } else {
            Ok(Self::NO_CHANGE)
        }
    }

    // use when bloc was dragged and change position
    pub async fn update_bloc_position(
        &self,
        id: String,
        new_position: String,
        updated_at: i64,
    ) -> Result<i8> {

        let current_position = self.get_position(id.clone()).await?;
        if current_position == new_position {
            return Ok(Self::NO_CHANGE);
        }
            
        let rows_affected = sqlx::query(
            "UPDATE blocs SET position = ?, updated_at = ? 
            WHERE id = ?",
        )
        .bind(&new_position)
        .bind(&updated_at)
        .bind(&id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        if rows_affected > 0 {
            Ok(Self::SUCCESS)
        } else {
            Ok(Self::NO_CHANGE)
        }
    }

    // use when a bloc was moved on an another page
    pub async fn update_bloc_page_id(&self, id: String, new_page_id: String) -> Result<bool> {
        let rows_affected = sqlx::query(
            "UPDATE blocs SET page_id = ? 
            WHERE id = ?",
        )
        .bind(&new_page_id)
        .bind(&id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    pub async fn delete_bloc(&self, id: String) -> Result<bool> {
        let rows_affected = sqlx::query("DELETE FROM blocs WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?
            .rows_affected();

        Ok(rows_affected > 0)
    }

    // use when a page was deleted
    pub async fn delete_bloc_by_page_id(&self, page_id: String) -> Result<bool> {
        let rows_affected = sqlx::query("DELETE FROM blocs WHERE page_id = ?")
            .bind(page_id)
            .execute(&self.pool)
            .await?
            .rows_affected();

        Ok(rows_affected > 0)
    }

    pub async fn get_position(&self, id: String) -> Result<String> {
        let position = sqlx::query("SELECT position FROM blocs WHERE id = ?")
            .bind(id)
            .fetch_one(&self.pool)
            .await?
            .get(0);
        Ok(position)
    }

    pub async fn get_checksum(&self, id: String) -> Result<String> {
        let checksum = sqlx::query("SELECT checksum FROM blocs WHERE id = ?")
            .bind(id)
            .fetch_one(&self.pool)
            .await?
            .get(0);
        Ok(checksum)
    }

    pub async fn get_bloc_by_id(&self, id: String) -> Result<BlocJson> {
        let bloc = sqlx::query_as::<_, BlocJson>(
            "SELECT id, position, content, checksum, page_id, bloc_type, created_at, updated_at 
            FROM blocs 
            WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(bloc)
    }

    // get all blocs in a specific page
    pub async fn get_blocs_by_page_id(&self, page_id: String) -> Result<Vec<BlocJson>> {
        let blocs = sqlx::query_as::<_, BlocJson>(
            "SELECT id, position, content, checksum, page_id, bloc_type, created_at, updated_at 
            FROM blocs 
            WHERE page_id = ?
            ORDER BY position",
        )
        .bind(page_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(blocs)
    }

    pub async fn new_page(&self, page: &PageJson) -> Result<String> {
        let id = sqlx::query(
            "INSERT INTO pages (id, path, title, cache, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?) 
            RETURNING id",
        )
        .bind(&page.id)
        .bind(&page.path)
        .bind(&page.title)
        .bind(&page.cache)
        .bind(&page.created_at)
        .bind(&page.updated_at)
        .fetch_one(&self.pool)
        .await?
        .get(0);

        Ok(id)
    }

    pub async fn update_page(&self, page: &PageJson) -> Result<bool> {
        let rows_affected = sqlx::query(
            "UPDATE pages SET path = ?, title = ?, cache = ?, updated_at = ? 
            WHERE id = ?",
        )
        .bind(&page.path)
        .bind(&page.title)
        .bind(&page.cache)
        .bind(&page.updated_at)
        .bind(&page.id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    // use when page was moved
    pub async fn update_page_path(&self, id: String, path: String) -> Result<bool> {
        let rows_affected = sqlx::query(
            "UPDATE pages SET path = ? 
            WHERE id = ?",
        )
        .bind(&path)
        .bind(&id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    pub async fn update_page_title(&self, id: String, title: String) -> Result<bool> {
        let rows_affected = sqlx::query(
            "UPDATE pages SET title = ? 
            WHERE id = ?",
        )
        .bind(&title)
        .bind(&id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    // use when the page was modified
    pub async fn update_page_cache(&self, id: String, cache: String) -> Result<bool> {
        let rows_affected = sqlx::query(
            "UPDATE pages SET cache = ? 
            WHERE id = ?",
        )
        .bind(&cache)
        .bind(&id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    pub async fn get_page_cache(&self, id: String) -> Result<String> {
        let cache = sqlx::query("SELECT cache FROM pages WHERE id = ?")
            .bind(id)
            .fetch_one(&self.pool)
            .await?
            .get(0);

        Ok(cache)
    }

    // use this before leaving the page when detecting a modification in the page
    pub async fn update_page_updated_at(&self, id: String, updated_at: i64) -> Result<bool> {
        let rows_affected = sqlx::query(
            "UPDATE pages SET updated_at = ? 
            WHERE id = ?",
        )
        .bind(&updated_at)
        .bind(&id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    pub async fn delete_page(&self, id: String) -> Result<bool> {
        let rows_affected = sqlx::query("DELETE FROM pages WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?
            .rows_affected();

        Ok(rows_affected > 0)
    }

    // use to get all pages in a specific path
    pub async fn get_pages_by_path(&self, path: String) -> Result<Vec<PageJson>> {
        let pages = sqlx::query_as::<_, PageJson>(
            "SELECT id, path, title, '' as cache, created_at, updated_at 
            FROM pages 
            WHERE path = ? ",
        )
        .bind(&path)
        .fetch_all(&self.pool)
        .await?;

        Ok(pages)
    }

    pub async fn new_prop(&self, prop: &PropsJson) -> Result<String> {
        let id = sqlx::query(
            "INSERT INTO props (id, key, value, bloc_id) 
            VALUES (?, ?, ?, ?) 
            RETURNING id",
        )
        .bind(&prop.id)
        .bind(&prop.key)
        .bind(&prop.value)
        .bind(&prop.bloc_id)
        .fetch_one(&self.pool)
        .await?
        .get(0);

        Ok(id)
    }

    pub async fn update_prop_value(
        &self,
        bloc_id: String,
        key: String,
        value: String,
    ) -> Result<bool> {
        let rows_affected = sqlx::query(
            "UPDATE props SET value = ? 
            WHERE bloc_id = ? AND key = ?",
        )
        .bind(value)
        .bind(bloc_id)
        .bind(key)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    // one prop is idetifies by the bloc_id and the prop key
    pub async fn delete_prop(&self, bloc_id: String, key: String) -> Result<bool> {
        let rows_affected = sqlx::query(
            "
        DELETE FROM props 
        WHERE bloc_id = ? AND key = ?",
        )
        .bind(bloc_id)
        .bind(key)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    // use when a bloc was deleted
    pub async fn delete_prop_by_bloc_id(&self, bloc_id: String) -> Result<bool> {
        let rows_affected = sqlx::query("DELETE FROM props WHERE bloc_id = ?")
            .bind(bloc_id)
            .execute(&self.pool)
            .await?
            .rows_affected();

        Ok(rows_affected > 0)
    }

    // get all props in a bloc
    pub async fn get_props_by_bloc_id(&self, bloc_id: String) -> Result<Vec<PropsJson>> {
        let props = sqlx::query_as::<_, PropsJson>(
            "SELECT id, key, value, bloc_id 
            FROM props 
            WHERE bloc_id = ?",
        )
        .bind(bloc_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(props)
    }

    // get bloc with the same key
    pub async fn get_props_by_key(&self, key: String) -> Result<Vec<PropsJson>> {
        let props = sqlx::query_as::<_, PropsJson>(
            "SELECT id, key, value, bloc_id 
            FROM props 
            WHERE key = ?",
        )
        .bind(key)
        .fetch_all(&self.pool)
        .await?;

        Ok(props)
    }

    // used to modify prop key name
    pub async fn change_prop_key_name(&self, key: String, new_key: String) -> Result<bool> {
        let rows_affected = sqlx::query(
            "UPDATE props SET key = ? 
            WHERE key = ?",
        )
        .bind(new_key)
        .bind(key)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    pub async fn query<T: serde::de::DeserializeOwned>(
        &self,
        collection: &str,
        json_path: &str,
        value: &str,
    ) -> Result<Vec<T>> {
        let query = format!(
            "SELECT node_map FROM pages 
             WHERE collection = ? AND json_extract(node_map, ?) = ?"
        );

        let rows = sqlx::query(&query)
            .bind(collection)
            .bind(json_path)
            .bind(value)
            .fetch_all(&self.pool)
            .await?;

        let mut results = Vec::new();
        for row in rows {
            let data: String = row.get("node_map");
            let item: T = serde_json::from_str(&data)?;
            results.push(item);
        }

        Ok(results)
    }
}
