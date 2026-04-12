const { MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
const Discord = require("discord.js");
const fetch = require("node-fetch");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Data = require(`pro.db`);
let lastUsed = new Map();

module.exports = {
    name: 'link',
    run: async (client, message, args) => {

        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
    
        if (!Data.has(`server_${message.guild.id}`) && !Data.has(`avatar_${message.guild.id}`) && !Data.has(`shop_${message.guild.id}`)) {
            const replyMessage = await message.reply(`**يرجى تثبيت شاتات نشر الروابط\n${prefix}edit-avt**`).catch(console.error);
            setTimeout(() => {
                replyMessage.delete().catch(console.error);
            }, 10000); // حذف الرسالة بعد مرور 10 ثواني
            return;
        }
        
        if (lastUsed.has(message.author.id)) {
            const diff = Date.now() - lastUsed.get(message.author.id);
            const cooldown = 180000; 
            if (diff < cooldown) {
                const timeLeft = cooldown - diff;
                const minutesLeft = Math.floor(timeLeft / 60000); 
                const secondsLeft = Math.floor((timeLeft % 60000) / 1000); 
        
                return await message.reply(`**يرجى الانتظار حتى انتهاء الوقت، الوقت المتبقي ${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}**`);
            }
        }
        
        const serverChannelId = Data.get(`server_${message.guild.id}`);
        const avatarChannelId = Data.get(`avatar_${message.guild.id}`);
        const shopChannelId = Data.get(`shop_${message.guild.id}`);
        
        const serverChannel = serverChannelId ? message.guild.channels.cache.get(serverChannelId) : null;
        const avatarChannel = avatarChannelId ? message.guild.channels.cache.get(avatarChannelId) : null;
        const shopChannel = shopChannelId ? message.guild.channels.cache.get(shopChannelId) : null;

        let link = args.slice(0).join(' ');
        if (!link || !link.startsWith('https://discord.gg')) {
            return await message.reply('**Wrong Usage** | #link <link>').then(m =>
                setTimeout(() => {
                    m.delete();
                }, 20000)
            );
        }
           // لـ استخراج إسم السيرفر عن طريق االرابط
        const inviteCode = link.split('discord.gg/')[1];
        const guild = await resolveInvite(inviteCode);
      
        if (!guild) {
            return await message.reply('**السيرفر غير موجود ❌.**').then(m =>
                setTimeout(() => {
                    m.delete();
                }, 20000)
            );
        }
      
        const serverName = guild.name;
      
        const deleteButton = new MessageButton()
            .setCustomId('Cancel2')
            .setLabel('الغاء')
            .setStyle('SECONDARY');
  
        const buttonRow = new MessageActionRow().addComponents(deleteButton);

        const options = [];

        if (serverChannel) {
            options.push({
                label: 'serv',
                description: '#مُخصص لسيرفرات الكوميونتي',
                value: '1',
            });
        }

        if (avatarChannel) {
            options.push({
                label: 'avvt',
                description: '#مُخصص لسيرفرات الافتارت',
                value: '2',
            });
        }

        if (shopChannel) {
            options.push({
                label: 'shop',
                description: '#مُخصص لسيرفرات المتاجر',
                value: '3',
            });
        }

        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('serverType')
                    .setPlaceholder('يرجى اختيار نوع القناة.')
                    .addOptions(options),
            );
      
        message.channel.send({ content: "**يرجى أختار نوع سيرفرك**", components: [row, buttonRow] }).then(messages => {
            message.delete();
            const filter = (interaction) => interaction.user.id === message.author.id;
            const collector = message.channel.createMessageComponentCollector({ filter, time: 20000 });
      
            collector.on('collect', async (interaction) => {
                if (interaction.isButton()) {
                    if (interaction.customId === 'Cancel2') {
                        // إلغاء النشر ومسح الرسالة
                        return await messages.delete().catch(console.error);
                    }
                }
                const content = interaction.values[0];
            
                let sentMessage;
                if (content === '1') {
                    if (serverChannel) {
                        sentMessage = await serverChannel.send(`> **${serverName}**\n${link}`);
                    }
                }
                if (content === '2') {
                    if (avatarChannel) {
                        sentMessage = await avatarChannel.send(`> **${serverName}**\n${link}`);
                    }
                }
                if (content === '3') {
                    if (shopChannel) {
                        sentMessage = await shopChannel.send(`> **${serverName}**\n${link}`);
                    }
                }
            
                lastUsed.set(message.author.id, Date.now());
            
                await interaction.update({ content: `**تم نشر سيرفرك بنجاح ${sentMessage ? sentMessage.channel : 'خطأ'} ✅**`, components: [] });
            });
      
            collector.on('end', () => {
                if (messages && messages.deletable) {
                    messages.delete();
                }
            });
        });
    }
};

async function resolveInvite(code) {
    const res = await fetch(`https://discord.com/api/v9/invites/${code}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.guild || !data.guild.id) return null;
    return { id: data.guild.id, name: data.guild.name };
}
