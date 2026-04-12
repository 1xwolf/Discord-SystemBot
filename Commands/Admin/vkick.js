const { Message, Client } = require("discord.js");
const { MessageEmbed } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

module.exports = {
    name: "vkick",
    description: "kick a member from the voice channel",
    usage: ["!vkick @user"],
    run: async (client, message, args) => {

        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
    
        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        const db = Pro.get(`Allow - Command vkick = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_CHANNELS')) {
            return message.react(`❌`);
        }
    
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!args[0]) {
            const embed = new MessageEmbed()
                .setColor(`${Color || `#f5f5ff`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة. \n${prefix}vkick <@user>**`);
            return message.reply({ embeds: [embed] });
        }

        if (!member) {
            return message.reply({ content: `**لا يمكنك طرد هذا العضو.**` }).catch((err) => {
                console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message);
            });
        }

        if (message.member.roles.highest.position <= member.roles.highest.position) {
            return message.reply({ content: `:rolling_eyes: **${member.user.username} لديه دور أعلى منك.**` }).catch((err) => {
                console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message);
            });
        }

        if (!member.voice.channel) {
            return message.reply({ content: `**المستخدم ليس في قناة صوتية.**` });
        }

        try {
            await member.voice.disconnect();
            message.reply({ content: `✅**${member.user.username} تم طرده من القناة الصوتية!**` });
        } catch (error) {
            console.error(error);
            message.reply({ content: `**حدث خطأ أثناء محاولة طرد العضو.**` });
        }
    },
};