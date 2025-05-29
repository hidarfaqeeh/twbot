import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT NOW()")
    console.log("✅ Database connected successfully at:", result.rows[0].now)
    client.release()
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
    return false
  }
}

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err)
  process.exit(-1)
})
