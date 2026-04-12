const { MessageEmbed } = require("discord.js");
const Discord = require("discord.js");
const Data = require(`pro.db`);

module.exports = {
  name: "unban-all",
  aliases: ["unbanal"],
  description: "لإلغاء الحظر عن الجميع",
  usage: ["!unban all"],
  run: async (client, message, args, config) => {

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }


    const Pro = require(`pro.db`);
    const db = Pro.get(`Allow - Command ban = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('ADMINISTRATOR')) {
      return;
    }

    try {
      let bans = await message.guild.bans.fetch();
      if (!bans.size) {
        return message.channel.send({ content: "**لا توجد اعضاء محظوريين ! 🙄**" });
      }
      bans.forEach((lynnanne) => {
        message.guild.members.unban(lynnanne.user);
      });

      // Log the unban action
      const logbanunban = Pro.get(`logbanunban_${message.guild.id}`); // Fetching log pic channel ID from the database
      const logChannel = message.guild.channels.cache.get(logbanunban);
      if (!logChannel) return;

      const executor = message.author;
      const logEmbed = new MessageEmbed()
        .setAuthor(executor.tag, executor.displayAvatarURL({ dynamic: true }))
        .setDescription(`**فك الحظر**\n\n**تم فك الحظر عن جميع الأعضاء**\n**بواسطة: ${executor}**\n\`\`\`Their number : ${bans.size}\`\`\`\ `)
        .setColor(`#880013`)
        .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1209557672299466804/unbanall.png?ex=65e75b5d&is=65d4e65d&hm=f77d5765dafb7ba365c8eaa22d83b1d9d75b5204cdc270a5c5069843c07bfe6b&' )
        .setFooter(message.guild.name, message.guild.iconURL({ dynamic: true }))
        .setTimestamp();
      logChannel.send({ embeds: [logEmbed] });

      // Reply to the command issuer
      message.reply({
        content: `! **تم إلغاء الحظر بنجاح عن \`${bans.size}\` أعضاء ✅**\nتم فك جميع الباند بنجاح.`,
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.error(error);
      message.reply({ content: "حدث خطأ أثناء تنفيذ الأمر", allowedMentions: { parse: [] } });
    }
  },
};
