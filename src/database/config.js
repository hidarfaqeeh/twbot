import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect()
    console.log("✅ Database connected successfully")
    client.release()
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
    return false
  }
}
