CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  draft TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(draft)),
  published TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(published)),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  published_revision INTEGER NOT NULL DEFAULT 0 CHECK (published_revision >= 0),
  updated_by TEXT,
  published_by TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT
);
INSERT INTO site_settings(id) VALUES (1);
CREATE TABLE site_settings_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  published_revision INTEGER NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data)),
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO site_settings_history(published_revision, data, actor) VALUES (0, '{}', 'sistema');
CREATE TRIGGER site_settings_published_history AFTER UPDATE OF published_revision ON site_settings WHEN NEW.published_revision > OLD.published_revision BEGIN
  INSERT INTO site_settings_history(published_revision, data, actor) VALUES (NEW.published_revision, NEW.published, NEW.published_by);
END;
