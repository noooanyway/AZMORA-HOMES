CREATE TABLE contact_history (id INTEGER PRIMARY KEY AUTOINCREMENT, contact_id TEXT NOT NULL, event TEXT NOT NULL, at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, actor TEXT, old_value TEXT, new_value TEXT, note TEXT);
CREATE INDEX contact_history_contact ON contact_history(contact_id,id DESC);
ALTER TABLE contact_requests ADD COLUMN history_actor TEXT;
ALTER TABLE contact_requests ADD COLUMN new_note TEXT NOT NULL DEFAULT '';
INSERT INTO contact_history(contact_id,event,at) SELECT id,'received',created_at FROM contact_requests;
CREATE TRIGGER contact_received AFTER INSERT ON contact_requests BEGIN
 INSERT INTO contact_history(contact_id,event,at) VALUES(NEW.id,'received',NEW.created_at);
END;
CREATE TRIGGER contact_status_history AFTER UPDATE OF status ON contact_requests WHEN OLD.status != NEW.status BEGIN
 INSERT INTO contact_history(contact_id,event,actor,old_value,new_value) VALUES(NEW.id,'status',NEW.history_actor,OLD.status,NEW.status);
END;
CREATE TRIGGER contact_note_history AFTER UPDATE OF new_note ON contact_requests WHEN NEW.new_note != '' BEGIN
 INSERT INTO contact_history(contact_id,event,actor,note) VALUES(NEW.id,'note',NEW.history_actor,NEW.new_note);
 UPDATE contact_requests SET new_note='',history_actor=NULL WHERE id=NEW.id;
END;
CREATE TRIGGER contact_actor_clear AFTER UPDATE OF status ON contact_requests WHEN NEW.history_actor IS NOT NULL BEGIN
 UPDATE contact_requests SET history_actor=NULL WHERE id=NEW.id;
END;
CREATE TRIGGER contact_notification_history AFTER UPDATE OF notification_status ON contact_requests WHEN OLD.notification_status != NEW.notification_status BEGIN
 INSERT INTO contact_history(contact_id,event,actor,old_value,new_value) VALUES(NEW.id,'notification',NULL,OLD.notification_status,NEW.notification_status);
END;
CREATE TRIGGER contact_history_delete AFTER DELETE ON contact_requests BEGIN
 DELETE FROM contact_history WHERE contact_id=OLD.id;
END;
