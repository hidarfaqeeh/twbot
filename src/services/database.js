import { pool } from "../database/config.js"
import logger from "../utils/logger.js"

export class DatabaseService {
  // إدارة القنوات
  async addChannel(channelId, channelName) {
    try {
      const query = `
        INSERT INTO channels (telegram_channel_id, telegram_channel_name)
        VALUES ($1, $2)
        ON CONFLICT (telegram_channel_id) 
        DO UPDATE SET 
          telegram_channel_name = $2,
          is_active = true
        RETURNING *
      `
      const result = await pool.query(query, [channelId, channelName])
      logger.info(`Channel added/updated: ${channelName} (${channelId})`)
      return result.rows[0]
    } catch (error) {
      logger.error("Error adding channel:", error)
      throw error
    }
  }

  async getActiveChannels() {
    try {
      const query = "SELECT * FROM channels WHERE is_active = true ORDER BY created_at DESC"
      const result = await pool.query(query)
      return result.rows
    } catch (error) {
      logger.error("Error getting channels:", error)
      throw error
    }
  }

  async deactivateChannel(channelId) {
    try {
      const query = "UPDATE channels SET is_active = false WHERE telegram_channel_id = $1"
      await pool.query(query, [channelId])
      logger.info(`Channel deactivated: ${channelId}`)
    } catch (error) {
      logger.error("Error deactivating channel:", error)
      throw error
    }
  }

  // إدارة مجموعات واتساب
  async addWhatsAppGroup(groupId, groupName) {
    try {
      const query = `
        INSERT INTO whatsapp_groups (group_id, group_name)
        VALUES ($1, $2)
        ON CONFLICT (group_id)
        DO UPDATE SET 
          group_name = $2,
          is_active = true
        RETURNING *
      `
      const result = await pool.query(query, [groupId, groupName])
      logger.info(`WhatsApp group added/updated: ${groupName} (${groupId})`)
      return result.rows[0]
    } catch (error) {
      logger.error("Error adding WhatsApp group:", error)
      throw error
    }
  }

  async getActiveWhatsAppGroups() {
    try {
      const query = "SELECT * FROM whatsapp_groups WHERE is_active = true ORDER BY created_at DESC"
      const result = await pool.query(query)
      return result.rows
    } catch (error) {
      logger.error("Error getting WhatsApp groups:", error)
      throw error
    }
  }

  async deactivateWhatsAppGroup(groupId) {
    try {
      const query = "UPDATE whatsapp_groups SET is_active = false WHERE group_id = $1"
      await pool.query(query, [groupId])
      logger.info(`WhatsApp group deactivated: ${groupId}`)
    } catch (error) {
      logger.error("Error deactivating WhatsApp group:", error)
      throw error
    }
  }

  // إدارة قواعد التوجيه
  async addForwardingRule(channelId, whatsappGroupId) {
    try {
      const query = `
        INSERT INTO forwarding_rules (channel_id, whatsapp_group_id)
        VALUES ($1, $2)
        ON CONFLICT (channel_id, whatsapp_group_id)
        DO UPDATE SET is_active = true
        RETURNING *
      `
      const result = await pool.query(query, [channelId, whatsappGroupId])
      logger.info(`Forwarding rule added: Channel ${channelId} -> WhatsApp Group ${whatsappGroupId}`)
      return result.rows[0]
    } catch (error) {
      logger.error("Error adding forwarding rule:", error)
      throw error
    }
  }

  async getForwardingRules() {
    try {
      const query = `
        SELECT fr.*, c.telegram_channel_id, c.telegram_channel_name,
               wg.group_id as whatsapp_group_id, wg.group_name as whatsapp_group_name
        FROM forwarding_rules fr
        JOIN channels c ON fr.channel_id = c.id
        JOIN whatsapp_groups wg ON fr.whatsapp_group_id = wg.id
        WHERE fr.is_active = true AND c.is_active = true AND wg.is_active = true
        ORDER BY fr.created_at DESC
      `
      const result = await pool.query(query)
      return result.rows
    } catch (error) {
      logger.error("Error getting forwarding rules:", error)
      throw error
    }
  }

  async deactivateForwardingRule(channelId, whatsappGroupId) {
    try {
      const query = `
        UPDATE forwarding_rules 
        SET is_active = false 
        WHERE channel_id = $1 AND whatsapp_group_id = $2
      `
      await pool.query(query, [channelId, whatsappGroupId])
      logger.info(`Forwarding rule deactivated: ${channelId} -> ${whatsappGroupId}`)
    } catch (error) {
      logger.error("Error deactivating forwarding rule:", error)
      throw error
    }
  }

  // تسجيل الرسائل
  async logMessage(telegramMessageId, telegramChannelId, whatsappGroupId, content, status = "sent") {
    try {
      const query = `
        INSERT INTO message_history (telegram_message_id, telegram_channel_id, whatsapp_group_id, message_content, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `
      const result = await pool.query(query, [telegramMessageId, telegramChannelId, whatsappGroupId, content, status])
      return result.rows[0]
    } catch (error) {
      logger.error("Error logging message:", error)
      throw error
    }
  }

  async getMessageStats(days = 7) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_messages,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages
        FROM message_history 
        WHERE forwarded_at >= NOW() - INTERVAL '${days} days'
      `
      const result = await pool.query(query)
      return result.rows[0]
    } catch (error) {
      logger.error("Error getting message stats:", error)
      throw error
    }
  }

  // إعدادات البوت
  async getSetting(key) {
    try {
      const query = "SELECT setting_value FROM bot_settings WHERE setting_key = $1"
      const result = await pool.query(query, [key])
      return result.rows[0]?.setting_value || null
    } catch (error) {
      logger.error("Error getting setting:", error)
      throw error
    }
  }

  async setSetting(key, value) {
    try {
      const query = `
        INSERT INTO bot_settings (setting_key, setting_value)
        VALUES ($1, $2)
        ON CONFLICT (setting_key)
        DO UPDATE SET 
          setting_value = $2, 
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `
      const result = await pool.query(query, [key, value])
      logger.info(`Setting updated: ${key} = ${value}`)
      return result.rows[0]
    } catch (error) {
      logger.error("Error setting value:", error)
      throw error
    }
  }

  // تنظيف البيانات القديمة
  async cleanOldMessages(days = 30) {
    try {
      const query = `
        DELETE FROM message_history 
        WHERE forwarded_at < NOW() - INTERVAL '${days} days'
      `
      const result = await pool.query(query)
      logger.info(`Cleaned ${result.rowCount} old messages`)
      return result.rowCount
    } catch (error) {
      logger.error("Error cleaning old messages:", error)
      throw error
    }
  }
}
