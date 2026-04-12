const { MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

// Define a map to keep track of bans issued by each user
const banCount = new Map();

// Reset ban count for each user after 24 hours
setInterval(() => {
  banCount.clear(); // Clear all ban counts
}, 24 * 60 * 60 * 1000); // Reset ban count every 24 hours

module.exports = {
  name: 'ban',
  aliases: ['برا', 'شقطحح', 'شقطح', 'ملحد', 'تفه'],
  run: async (client, message) => {
    const Color = Pro.get(`Guild_Color_${message.guild.id}`) || message.guild.me.displayHexColor || `#000000`;
    const allowedRoleId = Pro.get(`Allow_Command_ban_${message.guild.id}`);
    const allowedRole = message.guild.roles.cache.get(allowedRoleId);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    // Fetch the ban limit from the database
    const banLimit = Pro.get(`ban_limit_${message.guild.id}`) || 3; // Default to 3 if no limit is set

    // Check if the user has reached the ban limit
    if (banCount.has(message.author.id) && banCount.get(message.author.id) >= banLimit) {
      return message.reply(':rolling_eyes: - **The ban limit has been exceeded.**');
    }

    // Existing checks for permissions, member mention, etc.
    if (!isAuthorAllowed && message.member.id !== allowedRoleId && !message.member.permissions.has('BAN_MEMBERS')) {
      return message.react(`❌`);
    }

    const args = message.content.trim().split(/ +/);
    let member;

    // Attempt to fetch member from mention; otherwise check if ID is valid
    if (message.mentions.members.size) {
      member = message.mentions.members.first();
    } else if (args[1] && !isNaN(args[1])) {
      member = await message.guild.members.fetch(args[1]).catch(() => null);
    } else {
      const dbAliases = Pro.get(`aliases_${module.exports.name}`) || []; 
      const allAliases = [...new Set([...module.exports.aliases, ...dbAliases])]; 
      const aliases = allAliases.join(', '); 

      const embed = new MessageEmbed()
        .setColor(Color || `#000000`)
        .setTitle("Command: ban")
        .setDescription("Bans a member.")
        .addField("Aliases:", aliases || 'لا يوجد.')
        .addField("Usage:", `\`${prefix}ban [user]\``)
        .addField("Examples:", `\`${prefix}ban @user\`\n\`${prefix}ban 123456789012345678\``);
      return message.reply({ embeds: [embed] });
    }

    if (member.id === client.user.id) {
      return message.reply("**🙄 You can't ban a bot.**");
    }

    if (!message.guild.me.permissions.has('BAN_MEMBERS')) {
      return message.reply('**🙄 I do not have permission to ban members.**');
    }

    if (member.permissions.has('BAN_MEMBERS')) {
      return message.reply('**🙄 You cannot ban this member.**');
    }

    if (member.id === message.author.id) {
      return message.reply("**🙄 You cannot ban yourself.**");
    }

    const reason = args.slice(2).join(' ') || 'No reason provided';

    const bans = await message.guild.bans.fetch();
    if (bans.has(member.id)) {
      return message.reply("**This user is already banned.**");
    }

    try {
      await message.guild.members.ban(member, { reason });
      message.reply(`**:white_check_mark: ${member} banned from the server! :airplane:.**`);

      const currentCount = banCount.get(message.author.id) || 0;
      banCount.set(message.author.id, currentCount + 1);

      const logbanunban = Pro.get(`logbanunban_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.find((c) => c.id === logbanunban);

      if (logChannel) {
        const bannedMemberAvatar = member.user.displayAvatarURL({ dynamic: true });
        const embedLog = new MessageEmbed()
          .setColor("#880013")
          .setAuthor(member.user.tag, bannedMemberAvatar)
          .setDescription(`**حظر عضو**\n\n**لـ : <@${member.id}>**\n**بواسطة : <@${message.author.id}>**\n\`\`\`سبب : ${reason}\`\`\``)
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
          .setThumbnail('https://cdn.discordapp.com/attachments/1093303174774927511/1138892172574326874/82073587-11BA-4E4B-AC8F-8857CD89282F.png');

        await logChannel.send({ embeds: [embedLog] });
      }

      message.react(`✅`);
    } catch (error) {
      console.error(error);
      message.reply("**An error occurred while trying to ban the member.**");
    }
  }
};