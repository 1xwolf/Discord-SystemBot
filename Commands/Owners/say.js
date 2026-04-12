const { MessageAttachment, MessageEmbed } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const Data = require(`pro.db`);

module.exports = {
    name: 'say',
    run: async (client, message, args) => {


        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
        
        const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;


     
        if (message.author.bot) return;
        if (!message.channel.guild) return;
        
        if (!message.guild.me.permissions.has('ADMINISTRATOR')) {
            return message.reply('**لا استطيع إرسال الرسالة.**');
        }

        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        let content = args.slice(1).join(' ');
        let attach = message.attachments.first();

        const embed = new MessageEmbed()
        .setColor(`${Color || `#f5f5ff`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة \n${prefix}say <#${message.channel.id}> رسالة أو صورة**`);
        if (!channel)  return message.reply({ embeds: [embed] });



        if (!content && !attach) return message.reply('**يرجى إرسال الرسالة أو رفع صورة**');

        message.delete();

        try {
            if (attach) {
                const attachment = new MessageAttachment(attach.url);
                await channel.send({ content: content || ' ', files: [attachment] });
            } else {
                await channel.send({ content: content || ' ' });
            }
        } catch (error) {
            console.error(error);
            return message.reply('**حدث خطأ أثناء إرسال الرسالة**');
        }
    }
}
