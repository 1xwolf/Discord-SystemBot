const db = require("pro.db");
const { MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'pslist',
  description: "Displays the current status of all protection mechanisms.",
  usage: `${prefix}pslist`,
  run: async (client, message) => {
    // Check if the user is an owner
    if (!owners.includes(message.author.id)) {
      return message.react('❌');
    }

    // Ensure the command is used in a guild (server)
    if (!message.guild) {
      return;
    }

    // Retrieve the guild-specific color from the database
    const color = db.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff';

    // Utility function to check and return status in a localized format
    const checkStatus = (value) => {
      return value === 'on' || value === true ? 'مُفعل' : 'مُغلق'; // Active or Inactive
    };

    // Retrieve status of various protection mechanisms, checking both kebab-case and snake-case
    const antibotsStatus = checkStatus(db.get(`antibots_${message.guild.id}`) || db.get(`antibots-${message.guild.id}`));
    const anticreateStatus = checkStatus(db.get(`anticreate_${message.guild.id}`) || db.get(`anticreate-${message.guild.id}`));
    const antideleteStatus = checkStatus(db.get(`antiDelete_${message.guild.id}`) || db.get(`antiDelete-${message.guild.id}`));
    const antijoinStatus = checkStatus(db.get(`antijoinEnabled_${message.guild.id}`) || db.get(`antijoinEnabled-${message.guild.id}`));
    const antilinksStatus = checkStatus(db.get(`antilinks_${message.guild.id}`) || db.get(`antilinks-${message.guild.id}`));
    const antispamStatus = checkStatus(db.get(`spamProtectionEnabled_${message.guild.id}`) || db.get(`spamProtectionEnabled-${message.guild.id}`));
    const antiwebhookStatus = checkStatus(db.get(`antiWebhook_${message.guild.id}`) || db.get(`antiWebhook-${message.guild.id}`));
    const antipermsStatus = checkStatus(db.get(`antiPerms_${message.guild.id}`) || db.get(`antiPerms-${message.guild.id}`));
    const serverAvatarProtectionStatus = checkStatus(db.get(`antiServerAvatar_${message.guild.id}`) || db.get(`antiServerAvatar-${message.guild.id}`));
    const serverNameProtectionStatus = checkStatus(db.get(`antiServerName_${message.guild.id}`) || db.get(`antiServerName-${message.guild.id}`));

    // Create an embed message to display the current status
    const embed = new MessageEmbed()
      .setColor(color)
      .setTitle("Protection Status")
      .setDescription(`Here are the current statuses of the protection mechanisms:\n` +
                      `\`#1\` Antibots: ${antibotsStatus}\n` +
                      `\`#2\` Anticreate: ${anticreateStatus}\n` +
                      `\`#3\` Antidelete: ${antideleteStatus}\n` +
                      `\`#4\` Antijoin: ${antijoinStatus}\n` +
                      `\`#5\` AntiLinks: ${antilinksStatus}\n` +
                      `\`#6\` AntiSpam: ${antispamStatus}\n` +
                      `\`#7\` AntiWebhook: ${antiwebhookStatus}\n` +
                      `\`#8\` AntiPermissions: ${antipermsStatus}\n` +
                      `\`#9\` Server Avatar Protection: ${serverAvatarProtectionStatus}\n` +
                      `\`#10\` Server Name Protection: ${serverNameProtectionStatus}`);

    // Send the reply with the embed message
    message.reply({ embeds: [embed] });
  }
};