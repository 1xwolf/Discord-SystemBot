const { MessageEmbed } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const moment = require('moment');

module.exports = {
  name: "records",
  aliases: ["سجلات"],
  description: "Shows all punishment records of a member.",
  usage: ["!records @user"],
  
  run: async (client, message, args) => {
    try {
      // Validate permissions
      if (!await validatePermissions(message)) {
        return message.reply("**ليس لديك الإذن لاستخدام هذا الأمر.**");
      }

      // Get target member
      const member = getMemberFromMessage(message, args);
      if (!member) {
        return sendErrorEmbed(message, `**يرجى استخدام الأمر بالطريقة الصحيحة.\n${prefix}سجلات <@user>**`);
      }

      // Retrieve and format records
      const records = collectPunishmentRecords(member);

      // Send records
      if (records.length === 0) {
        return sendNoRecordsEmbed(message, member);
      }

      sendRecordsEmbed(message, member, records);
    } catch (error) {
      console.error('Error in records command:', error);
      message.reply('**حدث خطأ أثناء جلب السجلات.**');
    }
  }
};

// Permission validation
async function validatePermissions(message) {
  const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
  
  // Check for allowed role
  const allowedRoleId = Pro.get(`Allow - Command records = [ ${message.guild.id} ]`);
  const allowedRole = message.guild.roles.cache.get(allowedRoleId);
  const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
  
  // Check for Manage Channels permission
  const hasManageChannels = message.member.permissions.has('MANAGE_CHANNELS');
  
  return hasManageChannels || isAuthorAllowed;
}

// Get member from message
function getMemberFromMessage(message, args) {
  return message.mentions.members.first() || 
         message.guild.members.cache.get(args[0]);
}

// Collect and format punishment records
function collectPunishmentRecords(member) {
  const recordTypes = [
    { 
      key: 'Muted_Members', 
      type: '**كتم**', 
      timeField: 'times' 
    },
    { 
      key: 'Timeout_Members', 
      type: '**تايم أوت**', 
      timeField: 'endsAt' 
    },
    { 
      key: 'Prisoned_Members', 
      type: '**سجن**', 
      timeField: 'endDate' 
    }
  ];

  return recordTypes.flatMap(recordType => {
    const records = Pro.get(`${recordType.key}_${member.id}`) || [];
    return records.map(record => formatRecord(recordType.type, record, recordType.timeField));
  });
}

// Format individual record
function formatRecord(type, record, timeField) {
  return `${type}\n- السبب: ${record.reason}\n- المنفذ بواسطة: <@${record.by}>\n- النهاية: ${moment(record[timeField]).format('LLLL')}`;
}

// Send error embed
function sendErrorEmbed(message, description) {
  const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
  const embed = new MessageEmbed()
    .setColor(Color)
    .setDescription(description);
  return message.reply({ embeds: [embed] });
}

// Send no records embed
function sendNoRecordsEmbed(message, member) {
  const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
  const embedNoRecords = new MessageEmbed()
    .setColor(Color)
    .setDescription(`**لا توجد سجلات عقوبات للعضو ${member.user.username}.**`);
  return message.reply({ embeds: [embedNoRecords] });
}

// Send records embed
function sendRecordsEmbed(message, member, records) {
  const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
  const embedRecords = new MessageEmbed()
    .setColor(Color)
    .setTitle(`سجلات العقوبات للعضو ${member.user.username}`)
    .setDescription(records.join('\n\n'));
  message.reply({ embeds: [embedRecords] });
}