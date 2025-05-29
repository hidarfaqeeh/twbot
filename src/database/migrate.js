import { pool } from "./config.js"

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    telegram_channel_id VARCHAR(255) UNIQUE NOT NULL,
    telegram_channel_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) UNIQUE NOT NULL,
    group_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS forwarding_rules (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    whatsapp_group_id INTEGER REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS bot_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_channels_active ON channels(is_active);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_active ON whatsapp_groups(is_active);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_forwarding_rules_active ON forwarding_rules(is_active);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_message_history_date ON message_history(forwarded_at);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_message_history_status ON message_history(status);
  `,
]

async function runMigrations() {
  const client = await pool.connect()

  try {
    console.log("🔄 Running database migrations...")

    // Begin transaction
    await client.query("BEGIN")

    for (let i = 0; i < migrations.length; i++) {
      await client.query(migrations[i])
      console.log(`✅ Migration ${i + 1}/${migrations.length} completed`)
    }

    // Commit transaction
    await client.query("COMMIT")
    console.log("🎉 All migrations completed successfully")
  } catch (error) {
    // Rollback on error
    await client.query("ROLLBACK")
    console.error("❌ Migration failed:", error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { runMigrations }
