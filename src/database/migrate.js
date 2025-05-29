import { pool } from "./config.js"

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    telegram_channel_id VARCHAR(255) UNIQUE NOT NULL,
    telegram_channel_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) UNIQUE NOT NULL,
    group_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS forwarding_rules (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    whatsapp_group_id INTEGER REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, whatsapp_group_id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS message_history (
    id SERIAL PRIMARY KEY,
    telegram_message_id VARCHAR(255),
    telegram_channel_id VARCHAR(255),
    whatsapp_group_id VARCHAR(255),
    message_content TEXT,
    forwarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent'
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS bot_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
]

async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...")

    for (let i = 0; i < migrations.length; i++) {
      await pool.query(migrations[i])
      console.log(`✅ Migration ${i + 1}/${migrations.length} completed`)
    }

    console.log("🎉 All migrations completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

runMigrations()
