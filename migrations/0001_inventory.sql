CREATE TABLE inventory (
 id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)),
 state TEXT NOT NULL CHECK(state IN ('draft','live','archived')), revision INTEGER NOT NULL DEFAULT 1,
 actor TEXT NOT NULL, updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE activity (seq INTEGER PRIMARY KEY, unit TEXT NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TRIGGER inventory_insert AFTER INSERT ON inventory BEGIN
 INSERT INTO activity(unit,action,actor) VALUES(NEW.slug,NEW.state,NEW.actor);
END;
CREATE TRIGGER inventory_update AFTER UPDATE ON inventory BEGIN
 INSERT INTO activity(unit,action,actor) VALUES(NEW.slug,NEW.state,NEW.actor);
END;
CREATE TABLE uploads (path TEXT PRIMARY KEY, width INTEGER NOT NULL, height INTEGER NOT NULL);