CREATE TABLE inventory_commercial_history (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 inventory_id TEXT NOT NULL,
 old_state TEXT,
 new_state TEXT,
 actor TEXT NOT NULL,
 changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX inventory_commercial_history_lookup ON inventory_commercial_history(inventory_id, seq DESC);
CREATE TRIGGER inventory_commercial_insert AFTER INSERT ON inventory
 WHEN json_extract(NEW.data,'$.availability') = 'vendido'
 BEGIN
  INSERT INTO inventory_commercial_history(inventory_id,old_state,new_state,actor) VALUES(NEW.id,NULL,'vendido',NEW.actor);
 END;
CREATE TRIGGER inventory_commercial_update AFTER UPDATE ON inventory
 WHEN json_extract(OLD.data,'$.availability') IS NOT json_extract(NEW.data,'$.availability')
 BEGIN
  INSERT INTO inventory_commercial_history(inventory_id,old_state,new_state,actor) VALUES(NEW.id,json_extract(OLD.data,'$.availability'),json_extract(NEW.data,'$.availability'),NEW.actor);
 END;
