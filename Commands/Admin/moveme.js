const { MessageEmbed } = require("discord.js");
const Pro = require(`pro.db`);
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'moveme',
    aliases: ["ودني"],
    run: (client, message, args) => {

        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || message.guild.me.displayHexColor || `#000000`;
        if (!Color) return;

        const db = Pro.get(`Allow - Command move = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MOVE_MEMBERS')) {
            return message.react('❌');
        }

        const mentionedMember = message.mentions.members.first() || message.guild.members.cache.find(member => member.id === message.author.id);
        if (!mentionedMember) {
            return message.react('❌');
        }

        const authorVoiceChannel = message.member.voice.channel;
        const mentionedMemberVoiceChannel = mentionedMember.voice.channel;
        if (!mentionedMemberVoiceChannel || authorVoiceChannel === mentionedMemberVoiceChannel) {
            const embed = new MessageEmbed()
                .setColor(`${Color || message.guild.me.displayHexColor || `#000000`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}ودني <@${message.author.id}>**`);
            return message.reply({ embeds: [embed] });
        }

        mentionedMember.voice.setChannel(authorVoiceChannel);
        message.react('✅');

        // Get log channel ID from the database
        const logmove = Pro.get(`logmove_${message.guild.id}`);
        // Find the log channel by ID
        const logChannel = message.guild.channels.cache.find(c => c.id === logmove);
        // If log channel doesn't exist, return
        if (!logChannel) return;

        // Create an embed for the log message
        const embed = new MessageEmbed()
            .setAuthor(message.member.displayName, message.author.displayAvatarURL())
            .setDescription(`**تحريك العضو**\n\n**العضو المحرك: <@${message.author.id}>**\n**العضو المنقول: <@${mentionedMember.id}>**\n\n**من: <#${mentionedMemberVoiceChannel.id}>**\n**إلى: <#${authorVoiceChannel.id}>**`)
            .setColor(`#712519`)
            .setFooter(client.user.username, client.user.displayAvatarURL());

        // Send the embed to the log channel
        logChannel.send({ embeds: [embed] });
    }
}
