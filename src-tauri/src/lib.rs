use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS health_records (
                    id           INTEGER PRIMARY KEY AUTOINCREMENT,
                    date         TEXT    NOT NULL UNIQUE,
                    sleep_hours  REAL,
                    sleep_quality INTEGER,
                    exercise_min INTEGER,
                    water_ml     INTEGER,
                    condition    INTEGER,
                    wave_score   REAL,
                    note         TEXT,
                    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS goals (
                    id           INTEGER PRIMARY KEY AUTOINCREMENT,
                    type         TEXT NOT NULL,
                    title        TEXT NOT NULL,
                    target_value REAL NOT NULL,
                    unit         TEXT,
                    period       TEXT DEFAULT 'daily',
                    start_date   TEXT,
                    end_date     TEXT,
                    is_active    INTEGER DEFAULT 1,
                    created_at   TEXT DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS exercise_logs (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    date             TEXT NOT NULL,
                    exercise_name    TEXT NOT NULL,
                    duration_min     INTEGER,
                    completed        INTEGER DEFAULT 1,
                    health_record_id INTEGER REFERENCES health_records(id) ON DELETE SET NULL,
                    created_at       TEXT DEFAULT CURRENT_TIMESTAMP
                );
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:wavely.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
