const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

module.exports = {
    name: 'check',
    run: async (client, message) => {
        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        const db = Pro.get(`Allow - Command check = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('ADMINISTRATOR') && !message.member.permissions.has('MANAGE_ROLES') && !owners.includes(message.author.id) ) {
            return message.react('❌');
        }




        const args = message.content.split(' ');
        const roleId = args[1];
        const role = message.guild.roles.cache.find(e => e.id === roleId || e.name === roleId || `<@&${e.id}>` === roleId)

        if (!role) {
          const embed = new MessageEmbed()
              .setColor(Color)
              .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}check @Members**`);
              return message.reply({ embeds: [embed] });
      }

        const members = Array.from(role.members.values());
        const totalPages = Math.ceil(members.length / 10);

        let page = 1;
        const sendList = (page) => {
            const start = (page - 1) * 10;
            const end = page * 10;
            const memberList = members.slice(start, end).map((member, index) => {
                return `\`${index + 1}\` - <@${member.user.id}>`;
            }).join("\n");
            return `**Page ${page}/${totalPages}\n${memberList}**`;
        };

        const messageToSend = await message.reply({ content: sendList(page), components: [createButtons()] });

        const filter = i => i.user.id === message.author.id;
        const collector = messageToSend.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'previous') {
                page = Math.max(1, page - 1);
            } else if (i.customId === 'next') {
                page = Math.min(totalPages, page + 1);
            }

            await i.update(sendList(page), { components: [createButtons()] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                messageToSend.edit(sendList(page), { components: [] });
            }
        });
        function createButtons() {
          const previousButton = new MessageButton()
              .setCustomId('previous')
              .setEmoji("⬅️")
              .setStyle('PRIMARY');
      
          const nextButton = new MessageButton()
              .setCustomId('next')
              .setEmoji("➡️")
              .setStyle('PRIMARY');
      
          const row = new MessageActionRow()
              .addComponents(previousButton, nextButton);
      
          // Disable buttons if there are less than 10 members
          if (totalPages <= 1) {
              row.components.forEach(component => component.setDisabled(true));
          }
      
          return row;
      }
      
      
    }
};
