import { Telegraf } from "telegraf"
import logger from "../utils/logger.js"

export class TelegramService {
  constructor(token, databaseService, whatsappService) {
    this.bot = new Telegraf(token)
    this.db = databaseService
    this.whatsapp = whatsappService
    this.setupHandlers()
  }

  setupHandlers() {
    // معالج الأوامر الأساسية
    this.bot.start((ctx) => {
      ctx.reply(`
🤖 مرحباً بك في بوت توجيه الرسائل من تليجرام إلى واتساب!

الأوامر المتاحة:
/addchannel - إضافة قناة للمراقبة
/addgroup - إضافة مجموعة واتساب
/addrule - إضافة قاعدة توجيه
/listrules - عرض قواعد التوجيه
/status - حالة البوت
/help - المساعدة
      `)
    })

    this.bot.help((ctx) => {
      ctx.reply(`
📋 قائمة الأوامر:

/addchannel <channel_id> <channel_name> - إضافة قناة للمراقبة
/addgroup <group_id> <group_name> - إضافة مجموعة واتساب
/addrule <channel_id> <group_id> - ربط قناة بمجموعة
/listrules - عرض جميع قواعد التوجيه
/listchannels - عرض القنوات المراقبة
/listgroups - عرض مجموعات واتساب
/status - حالة الاتصالات
/stats - إحصائيات الرسائل

مثال:
/addchannel @mychannel قناتي
/addgroup 1234567890 مجموعتي
/addrule @mychannel 1234567890
      `)
    })

    // إضافة قناة
    this.bot.command("addchannel", async (ctx) => {
      try {
        const args = ctx.message.text.split(" ").slice(1)
        if (args.length < 2) {
          return ctx.reply("❌ الاستخدام: /addchannel <channel_id> <channel_name>")
        }

        const [channelId, ...nameParts] = args
        const channelName = nameParts.join(" ")

        await this.db.addChannel(channelId, channelName)
        ctx.reply(`✅ تم إضافة القناة: ${channelName} (${channelId})`)
        logger.info(`Channel added via command: ${channelId}`)
      } catch (error) {
        logger.error("Error in addchannel command:", error)
        ctx.reply("❌ حدث خطأ أثناء إضافة القناة")
      }
    })

    // إضافة مجموعة واتساب
    this.bot.command("addgroup", async (ctx) => {
      try {
        const args = ctx.message.text.split(" ").slice(1)
        if (args.length < 2) {
          return ctx.reply("❌ الاستخدام: /addgroup <group_id> <group_name>")
        }

        const [groupId, ...nameParts] = args
        const groupName = nameParts.join(" ")

        await this.db.addWhatsAppGroup(groupId, groupName)
        ctx.reply(`✅ تم إضافة مجموعة واتساب: ${groupName} (${groupId})`)
        logger.info(`WhatsApp group added via command: ${groupId}`)
      } catch (error) {
        logger.error("Error in addgroup command:", error)
        ctx.reply("❌ حدث خطأ أثناء إضافة المجموعة")
      }
    })

    // إضافة قاعدة توجيه
    this.bot.command("addrule", async (ctx) => {
      try {
        const args = ctx.message.text.split(" ").slice(1)
        if (args.length < 2) {
          return ctx.reply("❌ الاستخدام: /addrule <channel_id> <group_id>")
        }

        const [channelId, groupId] = args

        // البحث عن القناة والمجموعة
        const channels = await this.db.getActiveChannels()
        const groups = await this.db.getActiveWhatsAppGroups()

        const channel = channels.find((c) => c.telegram_channel_id === channelId)
        const group = groups.find((g) => g.group_id === groupId)

        if (!channel) {
          return ctx.reply(`❌ القناة ${channelId} غير موجودة. أضفها أولاً باستخدام /addchannel`)
        }

        if (!group) {
          return ctx.reply(`❌ مجموعة واتساب ${groupId} غير موجودة. أضفها أولاً باستخدام /addgroup`)
        }

        await this.db.addForwardingRule(channel.id, group.id)
        ctx.reply(`✅ تم ربط القناة ${channel.telegram_channel_name} بمجموعة ${group.group_name}`)
        logger.info(`Forwarding rule added: ${channelId} -> ${groupId}`)
      } catch (error) {
        logger.error("Error in addrule command:", error)
        ctx.reply("❌ حدث خطأ أثناء إضافة قاعدة التوجيه")
      }
    })

    // عرض قواعد التوجيه
    this.bot.command("listrules", async (ctx) => {
      try {
        const rules = await this.db.getForwardingRules()

        if (rules.length === 0) {
          return ctx.reply("📋 لا توجد قواعد توجيه مفعلة")
        }

        let message = "📋 قواعد التوجيه المفعلة:\n\n"
        rules.forEach((rule, index) => {
          message += `${index + 1}. ${rule.telegram_channel_name} (${rule.telegram_channel_id})\n`
          message += `   ↳ ${rule.whatsapp_group_name} (${rule.whatsapp_group_id})\n\n`
        })

        ctx.reply(message)
      } catch (error) {
        logger.error("Error in listrules command:", error)
        ctx.reply("❌ حدث خطأ أثناء عرض قواعد التوجيه")
      }
    })

    // حالة البوت
    this.bot.command("status", async (ctx) => {
      try {
        const telegramStatus = "✅ متصل"
        const whatsappStatus = this.whatsapp.isReady ? "✅ متصل" : "❌ غير متصل"

        const channels = await this.db.getActiveChannels()
        const groups = await this.db.getActiveWhatsAppGroups()
        const rules = await this.db.getForwardingRules()

        const message = `
📊 حالة البوت:

🔵 تليجرام: ${telegramStatus}
🟢 واتساب: ${whatsappStatus}

📈 الإحصائيات:
• القنوات المراقبة: ${channels.length}
• مجموعات واتساب: ${groups.length}
• قواعد التوجيه: ${rules.length}

⏰ آخر تحديث: ${new Date().toLocaleString("ar-SA")}
        `

        ctx.reply(message)
      } catch (error) {
        logger.error("Error in status command:", error)
        ctx.reply("❌ حدث خطأ أثناء عرض الحالة")
      }
    })

    // معالج رسائل القنوات
    this.bot.on("channel_post", async (ctx) => {
      try {
        await this.handleChannelPost(ctx)
      } catch (error) {
        logger.error("Error handling channel post:", error)
      }
    })

    // معالج الأخطاء
    this.bot.catch((err, ctx) => {
      logger.error("Telegram bot error:", err)
    })
  }

  async handleChannelPost(ctx) {
    try {
      const message = ctx.channelPost
      const channelId = message.chat.id.toString()

      logger.info(`Received message from channel: ${channelId}`)

      // البحث عن قواعد التوجيه لهذه القناة
      const rules = await this.db.getForwardingRules()
      const applicableRules = rules.filter(
        (rule) => rule.telegram_channel_id === channelId || rule.telegram_channel_id === `@${message.chat.username}`,
      )

      if (applicableRules.length === 0) {
        logger.info(`No forwarding rules found for channel: ${channelId}`)
        return
      }

      // تحضير محتوى الرسالة
      let messageContent = ""

      if (message.text) {
        messageContent = message.text
      } else if (message.caption) {
        messageContent = message.caption
      } else if (message.photo) {
        messageContent = "[صورة]"
      } else if (message.video) {
        messageContent = "[فيديو]"
      } else if (message.document) {
        messageContent = "[ملف]"
      } else {
        messageContent = "[رسالة وسائط]"
      }

      // إضافة معلومات القناة
      const channelName = message.chat.title || message.chat.username || "قناة غير معروفة"
      const forwardedMessage = `📢 من قناة: ${channelName}\n\n${messageContent}`

      // توجيه الرسالة لجميع المجموعات المرتبطة
      for (const rule of applicableRules) {
        try {
          await this.whatsapp.sendMessage(rule.whatsapp_group_id, forwardedMessage)

          // تسجيل الرسالة في قاعدة البيانات
          await this.db.logMessage(
            message.message_id.toString(),
            channelId,
            rule.whatsapp_group_id,
            messageContent,
            "sent",
          )

          logger.info(`Message forwarded: ${channelId} -> ${rule.whatsapp_group_id}`)
        } catch (error) {
          logger.error(`Failed to forward message to ${rule.whatsapp_group_id}:`, error)

          // تسجيل الخطأ
          await this.db.logMessage(
            message.message_id.toString(),
            channelId,
            rule.whatsapp_group_id,
            messageContent,
            "failed",
          )
        }
      }
    } catch (error) {
      logger.error("Error in handleChannelPost:", error)
    }
  }

  async start() {
    try {
      logger.info("Starting Telegram bot...")
      await this.bot.launch()
      logger.info("Telegram bot started successfully")
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
