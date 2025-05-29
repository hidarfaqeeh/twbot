import dotenv from "dotenv"
import express from "express"
import { Telegraf } from "telegraf"
import { Client, LocalAuth } from "whatsapp-web.js"
import qrcode from "qrcode"
import pg from "pg"

dotenv.config()

const { Pool } = pg

// إعداد قاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// إعداد Express للـ health check
const app = express()
const port = process.env.PORT || 3000

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

app.get("/", (req, res) => {
  res.json({ message: "Telegram WhatsApp Bot is running" })
})

app.listen(port, () => {
  console.log(`Health server running on port ${port}`)
})

// إعداد البوت
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// إعداد واتساب
const whatsappClient = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./whatsapp-session",
  }),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  },
})

let qrCodeData = null
let whatsappReady = false

// معالجات واتساب
whatsappClient.on("qr", async (qr) => {
  console.log("📱 QR Code received")
  try {
    qrCodeData = await qrcode.toDataURL(qr)

    // إرسال QR للمشرف إذا كان محدد
    if (process.env.ADMIN_USER_ID && qrCodeData) {
      const buffer = Buffer.from(qrCodeData.split(",")[1], "base64")
      await bot.telegram.sendPhoto(
        process.env.ADMIN_USER_ID,
        { source: buffer },
        { caption: "📱 امسح هذا الرمز لتسجيل الدخول إلى واتساب" },
      )
    }
  } catch (error) {
    console.error("Error processing QR:", error)
  }
})

whatsappClient.on("ready", () => {
  whatsappReady = true
  console.log("✅ WhatsApp client is ready!")

  // إشعار المشرف
  if (process.env.ADMIN_USER_ID) {
    bot.telegram.sendMessage(process.env.ADMIN_USER_ID, "✅ تم تسجيل الدخول إلى واتساب بنجاح!")
  }
})

whatsappClient.on("disconnected", (reason) => {
  whatsappReady = false
  console.log("⚠️ WhatsApp disconnected:", reason)
})

// معالجات تليجرام
bot.start((ctx) => {
  ctx.reply(`
🤖 مرحباً بك في بوت توجيه الرسائل!

الأوامر المتاحة:
/login - تسجيل الدخول إلى واتساب
/status - حالة البوت
/help - المساعدة
  `)
})

bot.command("login", async (ctx) => {
  try {
    if (process.env.ADMIN_USER_ID && ctx.from.id.toString() !== process.env.ADMIN_USER_ID) {
      return ctx.reply("❌ غير مصرح لك باستخدام هذا الأمر")
    }

    if (whatsappReady) {
      return ctx.reply("✅ واتساب متصل بالفعل!")
    }

    if (qrCodeData) {
      const buffer = Buffer.from(qrCodeData.split(",")[1], "base64")
      await ctx.replyWithPhoto({ source: buffer }, { caption: "📱 امسح هذا الرمز لتسجيل الدخول إلى واتساب" })
    } else {
      ctx.reply("⏳ جاري إنشاء رمز QR...")
    }
  } catch (error) {
    console.error("Error in login command:", error)
    ctx.reply("❌ حدث خطأ")
  }
})

bot.command("status", (ctx) => {
  const telegramStatus = "✅ متصل"
  const whatsappStatus = whatsappReady ? "✅ متصل" : "❌ غير متصل"

  ctx.reply(`
📊 حالة البوت:

🔵 تليجرام: ${telegramStatus}
🟢 واتساب: ${whatsappStatus}

⏰ آخر تحديث: ${new Date().toLocaleString()}
  `)
})

bot.help((ctx) => {
  ctx.reply(`
📋 الأوامر المتاحة:

/login - تسجيل الدخول إلى واتساب
/status - حالة الاتصالات
/help - عرض هذه المساعدة

💡 لإضافة المزيد من الميزات، راجع الوثائق.
  `)
})

// بدء الخدمات
async function startBot() {
  try {
    console.log("🚀 Starting bot...")

    // اختبار قاعدة البيانات
    try {
      const client = await pool.connect()
      console.log("✅ Database connected")
      client.release()
    } catch (error) {
      console.error("❌ Database connection failed:", error)
    }

    // بدء واتساب
    console.log("📱 Initializing WhatsApp...")
    await whatsappClient.initialize()

    // بدء تليجرام
    console.log("🔵 Starting Telegram bot...")
    await bot.launch()

    console.log("✅ Bot started successfully!")

    // معالج الإغلاق
    process.once("SIGINT", () => bot.stop("SIGINT"))
    process.once("SIGTERM", () => bot.stop("SIGTERM"))
  } catch (error) {
    console.error("❌ Failed to start bot:", error)
    process.exit(1)
  }
}

startBot()
