CREATE TABLE contact_requests (
 id TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, dedupe_key TEXT UNIQUE NOT NULL,
 name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
 island TEXT NOT NULL DEFAULT '', locality TEXT NOT NULL DEFAULT '',
 houses TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(houses)), typology TEXT NOT NULL DEFAULT '',
 request_type TEXT NOT NULL, message TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','working','answered','archived')),
 notes TEXT NOT NULL DEFAULT '', revision INTEGER NOT NULL DEFAULT 1,
 notification_status TEXT NOT NULL DEFAULT 'pending' CHECK(notification_status IN ('pending','sending','sent','failed','uncertain')),
 resend_id TEXT, email_payload TEXT, first_attempt INTEGER, lease_until INTEGER NOT NULL DEFAULT 0,
 next_attempt INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, notification_error TEXT
);
CREATE INDEX contacts_created ON contact_requests(created_at DESC);
CREATE INDEX contacts_status ON contact_requests(status,created_at DESC);
CREATE TABLE contact_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE contact_tokens (hash TEXT PRIMARY KEY, expires INTEGER NOT NULL);
