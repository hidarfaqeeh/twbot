import { Telegraf } from "telegraf"
import logger from "../utils/logger.js"

class TelegramService {
  constructor(whatsapp, config) {
    this.whatsapp = whatsapp
    this.config = config
    this.bot = new Telegraf(config.telegram.botToken)
    this.adminUserId = config.adminUserId

    this.initialize()
  }

  initialize() {
    this.bot.start((ctx) => ctx.reply("Welcome!"))

    // أمر تسجيل الدخول
    this.bot.command("login", async (ctx) => {
      try {
        if (this.adminUserId && ctx.from.id.toString() !== this.adminUserId) {
          return ctx.reply("❌ غير مصرح لك باستخدام هذا الأمر")
        }

        if (this.whatsapp.isReady) {
          return ctx.reply("✅ واتساب متصل بالفعل!")
        }

        // إذا كان WhatsApp لم يتم تهيئته بعد، ابدأ التهيئة
        if (!this.whatsapp.isInitializing && !this.whatsapp.initializationPromise) {
          ctx.reply("🔄 جاري تهيئة WhatsApp... سيتم إرسال رمز QR قريباً")
          this.whatsapp.initialize(this)
          return
        }

        const qrCode = this.whatsapp.getQRCode()
        if (qrCode) {
          const buffer = Buffer.from(qrCode.split(",")[1], "base64")
          await ctx.replyWithPhoto(
            { source: buffer },
            {
              caption: "📱 امسح هذا الرمز بواتساب لتسجيل الدخول\n⏰ الرمز صالح لمدة 20 ثانية فقط",
            },
          )
        } else {
          ctx.reply("⏳ جاري إنشاء رمز QR... سيتم إرساله قريباً")
        }
      } catch (error) {
        logger.error("Error in login command:", error)
        ctx.reply("❌ حدث خطأ أثناء محاولة تسجيل الدخول")
      }
    })

    // أمر إعادة الاتصال
    this.bot.command("reconnect", async (ctx) => {
      try {
        if (this.adminUserId && ctx.from.id.toString() !== this.adminUserId) {
          return ctx.reply("❌ غير مصرح لك باستخدام هذا الأمر")
        }

        ctx.reply("🔄 جاري إعادة تهيئة WhatsApp...")
        await this.whatsapp.reconnect()
      } catch (error) {
        logger.error("Error in reconnect command:", error)
        ctx.reply("❌ حدث خطأ أثناء إعادة الاتصال")
      }
    })

    this.bot.launch()

    // Enable graceful stop
    process.once("SIGINT", () => this.bot.stop("SIGINT"))
    process.once("SIGTERM", () => this.bot.stop("SIGTERM"))
  }

  sendMessage(chatId, message) {
    this.bot.telegram.sendMessage(chatId, message)
  }
}

export default TelegramService
