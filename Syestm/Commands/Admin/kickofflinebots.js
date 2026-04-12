const { MessageEmbed } = require('discord.js');
const Pro = require("pro.db"); // تم تعديل db إلى Pro وفقاً للسياق
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "kickofflinebots",
  aliases: ["kickofflinebots"],
  description: "Kick all offline bots from the server.",
  usage: ["!kickofflinebots"],
  run: async (client, message, args) => {


        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
    
        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        const db = Pro.get(`Allow - Command kickofflinebots = [ ${message.guild.id} ]`)
const allowedRole = message.guild.roles.cache.get(db);
const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

if (!isAuthorAllowed && message.author.id !== db  && !message.member.permissions.has('BAN_MEMBERS')) {
    // إجراءات للتصرف عندما لا يتحقق الشرط
    return message.react(`❌`);
}
    // Check bot permissions
    if (!message.guild.me.permissions.has("KICK_MEMBERS")) {
      return message.reply("❌ - **ليس لدي الصلاحية لطرد الأعضاء.**");
    }

    // Filter offline bots
    const bots = message.guild.members.cache.filter(member => 
      member.user.bot && 
      (member.presence?.status === "offline" || member.presence === null)
    );

    // Check if there are any offline bots
    if (bots.size === 0) {
      return message.reply("**لا توجد بوتات غير متصلة لطردها.**");
    }

    const kickedBots = [];
    const failedBots = [];

    // Kick offline bots
    await Promise.all(bots.map(async (bot) => {
      try {
        // Skip kicking the bot running the command
        if (bot.id === client.user.id) return;

        // Check if the bot can be kicked
        if (bot.kickable) {
          await bot.kick("Bot is offline");
          kickedBots.push(bot.user.tag);
        } else {
          failedBots.push(bot.user.tag);
        }
      } catch (error) {
        console.error(`فشل في طرد البوت ${bot.user.tag}: ${error.message}`);
        failedBots.push(bot.user.tag);
      }
    }));

    // Create embed with results
    const embed = new MessageEmbed()
      .setColor("#ff0000")
      .setTitle("📋 نتائج طرد البوتات")
      .addFields(
        { 
          name: "✅ البوتات المطرودة", 
          value: kickedBots.length > 0 ? kickedBots.join("\n") : "لا بوتات تم طردها", 
          inline: false 
        },
        { 
          name: "❌ البوتات التي تعذر طردها", 
          value: failedBots.length > 0 ? failedBots.join("\n") : "لا توجد بوتات فشل طردها", 
          inline: false 
        }
      )
      .setFooter({ text: `إجمالي البوتات: ${bots.size}` });

    // أرسل النتيجة إلى القناة
    message.channel.send({ embeds: [embed] });
  },
};