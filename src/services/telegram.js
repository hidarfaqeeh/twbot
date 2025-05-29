import { Telegraf } from "telegraf"
import logger from "../utils/logger.js"

export class TelegramService {
  constructor(token, databaseService, whatsappService) {
    this.bot = new Telegraf(token)
    this.db = databaseService
    this.whatsapp = whatsappService
    this.adminUserId = process.env.ADMIN_USER_ID
    this.setupHandlers()
  }

  setupHandlers() {
    // معالج الأوامر الأساسية
    this.bot.start((ctx) => {
      ctx.reply(`
🤖 مرحباً بك في بوت توجيه الرسائل من تليجرام إلى واتساب!

الأوامر المتاحة:
/login - تسجيل الدخول إلى واتساب
/reconnect - إعادة الاتصال بواتساب
/addchannel - إضافة قناة للمراقبة
/addgroup - إضافة مجموعة واتساب
/addrule - إضافة قاع��ة توجيه
/listrules - عرض قواعد التوجيه
/listchannels - عرض القنوات
/listgroups - عرض مجموعات واتساب
/status - حالة البوت
/help - المساعدة

استخدم /help للحصول على تفاصيل أكثر.
      `)
    })

    this.bot.help((ctx) => {
      ctx.reply(`
📋 قائمة الأوامر التفصيلية:

🔐 أوامر التسجيل:
/login - تسجيل الدخول إلى واتساب عبر رمز QR
/reconnect - إعادة الاتصال بواتساب

📊 إدارة القنوات والمجموعات:
/addchannel <channel_id> <channel_name> - إضافة قناة للمراقبة
/addgroup <group_id> <group_name> - إضافة مجموعة واتساب
/addrule <channel_id> <group_id> - ربط قناة بمجموعة

📋 عرض المعلومات:
/listrules - عرض جميع قواعد التوجيه
/listchannels - عرض القنوات المراقبة
/listgroups - عرض مجموعات واتساب
/status - حالة الاتصالات
/stats - إحصائيات الرسائل

💡 أمثلة:
/addchannel @mynewschannel قناة الأخبار
/addgroup 201234567890 مجموعة الأصدقاء
/addrule @mynewschannel 201234567890
      `)
    })

    // أمر تسجيل الدخول
    this.bot.command("login", async (ctx) => {
      try {
        if (this.adminUserId && ctx.from.id.toString() !== this.adminUserId) {
          return ctx.reply("❌ غير مصرح لك باستخدام هذا الأمر")
        }

        if (this.whatsapp.isReady) {
          return ctx.reply("✅ واتساب متصل بالفعل!")
        }

        ctx.reply("🔄 جاري تهيئة WhatsApp... سيتم إرسال رمز QR قريباً")

        // بدء تهيئة WhatsApp
        const success = await this.whatsapp.initialize(this)

        if (!success) {
          ctx.reply("❌ فشل في تهيئة WhatsApp. حاول مرة أخرى لاحقاً.")
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

    // حالة البوت
    this.bot.command("status", async (ctx) => {
      try {
        const telegramStatus = "✅ متصل"
        const whatsappStatus = this.whatsapp.isReady ? "✅ متصل" : "❌ غير متصل"

        const message = `
📊 حالة البوت:

🔵 تليجرام: ${telegramStatus}
🟢 واتساب: ${whatsappStatus}

⏰ آخر تحديث: ${new Date().toLocaleString("ar-SA", {
          timeZone: "Africa/Cairo",
        })}
        `

        ctx.reply(message)
      } catch (error) {
        logger.error("Error in status command:", error)
        ctx.reply("❌ حدث خطأ أثناء عرض الحالة")
      }
    })

    // معالج الأخطاء
    this.bot.catch((err, ctx) => {
      logger.error("Telegram bot error:", err)
    })
  }

  async sendQRCode(qrCodeDataURL) {
    try {
      if (this.adminUserId) {
        const buffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64")
        await this.bot.telegram.sendPhoto(
          this.adminUserId,
          { source: buffer },
          {
            caption: "📱 رمز QR لتسجيل الدخول إلى واتساب\n⏰ الرمز صالح لمدة 20 ثانية فقط",
          },
        )
        logger.info("QR code sent to admin via Telegram")
      }
    } catch (error) {
      logger.error("Error sending QR code via Telegram:", error)
    }
  }

  async notifyWhatsAppReady() {
    try {
      if (this.adminUserId) {
        await this.bot.telegram.sendMessage(this.adminUserId, "✅ تم تسجيل الدخول إلى واتساب بنجاح!")
        logger.info("WhatsApp ready notification sent to admin")
      }
    } catch (error) {
      logger.error("Error sending WhatsApp ready notification:", error)
    }
  }

  async notifyWhatsAppDisconnected(reason) {
    try {
      if (this.adminUserId) {
        await this.bot.telegram.sendMessage(this.adminUserId, `⚠️ تم قطع الاتصال مع واتساب\nالسبب: ${reason}`)
        logger.info("WhatsApp disconnection notification sent to admin")
      }
    } catch (error) {
      logger.error("Error sending WhatsApp disconnection notification:", error)
    }
  }

  async start() {
    try {
      logger.info("Starting Telegram bot...")
      await this.bot.launch()
      logger.info("✅ Telegram bot started successfully")
    } catch (error) {
      logger.error("Failed to start Telegram bot:", error)
      throw error
    }
  }

  async stop() {
    try {
      logger.info("Stopping Telegram bot...")
      this.bot.stop()
      logger.info("Telegram bot stopped")
    } catch (error) {
      logger.error("Error stopping Telegram bot:", error)
    }
  }
}
