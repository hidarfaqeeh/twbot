class TelegramService {
  constructor(bot) {
    this.bot = bot
  }

  start() {
    this.bot.start((ctx) => {
      ctx.reply(`
🤖 مرحباً بك في بوت توجيه الرسائل من تليجرام إلى واتساب!

الأوامر المتاحة:
/login - تسجيل الدخول إلى واتساب
/addchannel - إضافة قناة للمراقبة
/addgroup - إضافة مجموعة واتساب
/addrule - إضافة قاعدة توجيه
/listrules - عرض قواعد التوجيه
/status - حالة البوت
/help - المساعدة
  `)
    })
  }

  help() {
    this.bot.help((ctx) => {
      ctx.reply(`
📋 قائمة الأوامر:

/login - تسجيل الدخول إلى واتساب عبر رمز QR
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
  }

  addChannel(callback) {
    this.bot.command("addchannel", (ctx) => {
      const args = ctx.message.text.split(" ").slice(1)
      if (args.length < 2) {
        return ctx.reply("الرجاء إدخال معرف القناة واسمها. مثال: /addchannel @mychannel قناتي")
      }
      const channelId = args[0]
      const channelName = args[1]
      callback(channelId, channelName, ctx)
    })
  }

  addGroup(callback) {
    this.bot.command("addgroup", (ctx) => {
      const args = ctx.message.text.split(" ").slice(1)
      if (args.length < 2) {
        return ctx.reply("الرجاء إدخال معرف المجموعة واسمها. مثال: /addgroup 1234567890 مجموعتي")
      }
      const groupId = args[0]
      const groupName = args[1]
      callback(groupId, groupName, ctx)
    })
  }

  addRule(callback) {
    this.bot.command("addrule", (ctx) => {
      const args = ctx.message.text.split(" ").slice(1)
      if (args.length < 2) {
        return ctx.reply("الرجاء إدخال معرف القناة ومعرف المجموعة. مثال: /addrule @mychannel 1234567890")
      }
      const channelId = args[0]
      const groupId = args[1]
      callback(channelId, groupId, ctx)
    })
  }

  listRules(callback) {
    this.bot.command("listrules", (ctx) => {
      callback(ctx)
    })
  }

  listChannels(callback) {
    this.bot.command("listchannels", (ctx) => {
      callback(ctx)
    })
  }

  listGroups(callback) {
    this.bot.command("listgroups", (ctx) => {
      callback(ctx)
    })
  }

  status(callback) {
    this.bot.command("status", (ctx) => {
      callback(ctx)
    })
  }

  login(callback) {
    this.bot.command("login", (ctx) => {
      callback(ctx)
    })
  }

  stats(callback) {
    this.bot.command("stats", (ctx) => {
      callback(ctx)
    })
  }

  launch() {
    this.bot.launch()
  }
}

export class TelegramService {
  // تعريف الكلاس هنا
}
