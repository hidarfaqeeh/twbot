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
/addchannel - إضافة قناة للمراقبة
/addgroup - إضافة مجموعة واتساب
/addrule - إضافة قاعدة توجيه
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

    // إضافة قناة
    this.bot.command("addchannel", async (ctx) => {
      try {
        const args = ctx.message.text.split(" ").slice(1)
        if (args.length < 2) {
          return ctx.reply(
            "❌ الاستخدام: /addchannel <channel_id> <channel_name>\n\nمثال: /addchannel @mynewschannel قناة الأخبار",
          )
        }

        const [channelId, ...nameParts] = args
        const channelName = nameParts.join(" ")

        await this.db.addChannel(channelId, channelName)
        ctx.reply(`✅ تم إضافة القناة بنجاح:\n📺 ${channelName} (${channelId})`)
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
          return ctx.reply(
            "❌ الاستخدام: /addgroup <group_id> <group_name>\n\nمثال: /addgroup 201234567890 مجموعة الأصدقاء",
          )
        }

        const [groupId, ...nameParts] = args
        const groupName = nameParts.join(" ")

        await this.db.addWhatsAppGroup(groupId, groupName)
        ctx.reply(`✅ تم إضافة مجموعة واتساب بنجاح:\n💬 ${groupName} (${groupId})`)
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
          return ctx.reply(
            "❌ الاستخدام: /addrule <channel_id> <group_id>\n\nمثال: /addrule @mynewschannel 201234567890",
          )
        }

        const [channelId, groupId] = args

        // البحث عن القناة والمجموعة
        const channels = await this.db.getActiveChannels()
        const groups = await this.db.getActiveWhatsAppGroups()

        const channel = channels.find((c) => c.telegram_channel_id === channelId)
        const group = groups.find((g) => g.group_id === groupId)

        if (!channel) {
          return ctx.reply(
            `❌ القناة ${channelId} غير موجودة.\nأضفها أولاً باستخدام: /addchannel ${channelId} اسم_القناة`,
          )
        }

        if (!group) {
          return ctx.reply(
            `❌ مجموعة واتساب ${groupId} غير موجودة.\nأضفها أولاً باستخدام: /addgroup ${groupId} اسم_المجموعة`,
          )
        }

        await this.db.addForwardingRule(channel.id, group.id)
        ctx.reply(`✅ تم ربط القناة بالمجموعة بنجاح:\n📺 ${channel.telegram_channel_name}\n↓\n💬 ${group.group_name}`)
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
          return ctx.reply("📋 لا توجد قواعد توجيه مفعلة حالياً")
        }

        let message = "📋 قواعد التوجيه المفعلة:\n\n"
        rules.forEach((rule, index) => {
          message += `${index + 1}. 📺 ${rule.telegram_channel_name} (${rule.telegram_channel_id})\n`
          message += `   ↓ 💬 ${rule.whatsapp_group_name} (${rule.whatsapp_group_id})\n\n`
        })

        ctx.reply(message)
      } catch (error) {
        logger.error("Error in listrules command:", error)
        ctx.reply("❌ حدث خطأ أثناء عرض قواعد التوجيه")
      }
    })

    // عرض القنوات
    this.bot.command("listchannels", async (ctx) => {
      try {
        const channels = await this.db.getActiveChannels()

        if (channels.length === 0) {
          return ctx.reply("📺 لا توجد قنوات مراقبة حالياً")
        }

        let message = "📺 القنوات المراقبة:\n\n"
        channels.forEach((channel, index) => {
          message += `${index + 1}. ${channel.telegram_channel_name} (${channel.telegram_channel_id})\n`
        })

        ctx.reply(message)
      } catch (error) {
        logger.error("Error in listchannels command:", error)
        ctx.reply("❌ حدث خطأ أثناء عرض القنوات")
      }
    })

    // عرض مجموعات واتساب
    this.bot.command("listgroups", async (ctx) => {
      try {
        const groups = await this.db.getActiveWhatsAppGroups()

        if (groups.length === 0) {
          return ctx.reply("💬 لا توجد مجموعات واتساب مضافة حالياً")
        }

        let message = "💬 مجموعات واتساب:\n\n"
        groups.forEach((group, index) => {
          message += `${index + 1}. ${group.group_name} (${group.group_id})\n`
        })

        ctx.reply(message)
      } catch (error) {
        logger.error("Error in listgroups command:", error)
        ctx.reply("❌ حدث خطأ أثناء عرض المجموعات")
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
• قواعد التوجيه النشطة: ${rules.length}

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

    // إحصائيات الرسائل
    this.bot.command("stats", async (ctx) => {
      try {
        // يمكن إضافة استعلامات قاعدة البيانات للإحصائيات هنا
        ctx.reply("📊 الإحصائيات:\n\n🔄 هذه الميزة قيد التطوير...")
      } catch (error) {
        logger.error("Error in stats command:", error)
        ctx.reply("❌ حدث خطأ أثناء عرض الإحصائيات")
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
      const channelUsername = message.chat.username ? `@${message.chat.username}` : null

      logger.info(`📨 Received message from channel: ${channelId}`)

      // البحث عن قواعد التوجيه لهذه القناة
      const rules = await this.db.getForwardingRules()
      const applicableRules = rules.filter(
        (rule) => rule.telegram_channel_id === channelId || rule.telegram_channel_id === channelUsername,
      )

      if (applicableRules.length === 0) {
        logger.info(`No forwarding rules found for channel: ${channelId}`)
        return
      }

      // تحضير محتوى الرسالة
      const messageContent = this.extractMessageContent(message)

      // إضافة معلومات القناة
      const channelName = message.chat.title || message.chat.username || "قناة غير معروفة"
      const forwardedMessage = `📢 من قناة: ${channelName}\n\n${messageContent}`

      // توجيه الرسالة لجميع المجموعات المرتبطة
      for (const rule of applicableRules) {
        try {
          const result = await this.whatsapp.sendMessage(rule.whatsapp_group_id, forwardedMessage)

          // تسجيل الرسالة في قاعدة البيانات
          const status = result.success ? "sent" : "failed"
          await this.db.logMessage(
            message.message_id.toString(),
            channelId,
            rule.whatsapp_group_id,
            messageContent,
            status,
          )

          if (result.success) {
            logger.info(`✅ Message forwarded: ${channelId} -> ${rule.whatsapp_group_id}`)
          } else {
            logger.error(`❌ Failed to forward message to ${rule.whatsapp_group_id}: ${result.error}`)
          }
        } catch (error) {
          logger.error(`❌ Error forwarding message to ${rule.whatsapp_group_id}:`, error)

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

  extractMessageContent(message) {
    if (message.text) {
      return message.text
    } else if (message.caption) {
      return message.caption
    } else if (message.photo) {
      return "[صورة]" + (message.caption ? ` - ${message.caption}` : "")
    } else if (message.video) {
      return "[فيديو]" + (message.caption ? ` - ${message.caption}` : "")
    } else if (message.document) {
      return "[ملف]" + (message.caption ? ` - ${message.caption}` : "")
    } else if (message.audio) {
      return "[ملف صوتي]" + (message.caption ? ` - ${message.caption}` : "")
    } else if (message.voice) {
      return "[رسالة صوتية]"
    } else if (message.sticker) {
      return "[ملصق]"
    } else {
      return "[رسالة وسائط]"
    }
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
