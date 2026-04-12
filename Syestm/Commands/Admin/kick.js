const Pro = require('pro.db');
const { MessageEmbed } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'kick',
    aliases: ['طرد'],
    run: async function (client, message) {

        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        const Color = Pro.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        const args = message.content.split(' ');
        const db = Pro.get(`Allow - Command kick = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('KICK_MEMBERS')) {
            return message.react('❌');
        }

        const memberArg = args[1];
        const member = message.mentions.members.first() || message.guild.members.cache.find(member => member.id === memberArg || member.user.tag === memberArg || member.user.username === memberArg);
        
        if (!member) {
            const dbAliases = Pro.get(`aliases_${module.exports.name}`) || []; // Fetch aliases from the database
            const allAliases = [...new Set([...module.exports.aliases, ...dbAliases])]; // Combine and deduplicate aliases
            const aliases = allAliases.join(', '); // Format aliases for display

            const embed = new MessageEmbed()
                .setColor(Color)
                .setTitle("Command: kick")
                .setDescription("Kicks a member from the server.")
                .addField("Aliases:", aliases || 'لا يوجد.')
                .addField("Usage:", `\`${prefix}kick [user]\``)
                .addField("Examples:", `\`${prefix}kick @user\``)
                .setFooter("Please mention the user to kick.");

            return message.reply({ embeds: [embed] });
        }

        if (member.roles.highest.position >= message.member.roles.highest.position && !owners.includes(message.author.id)) { 
            return message.reply('**لا يمكنك طرد شخصٍ أعلى منك بالأدوار.**'); 
        }
        
        // Check if a reason is provided
        let kickReason = args.slice(2).join(' ');
        if (!kickReason) {
            kickReason = 'No reason';
        }

        // Kick the member
        await member.kick(kickReason);

        // Send log to the log channel
        const logkick = Pro.get(`logkick_${message.guild.id}`); // Fetching log kick channel ID from the database
        const logChannel = message.guild.channels.cache.get(logkick);
        if (logChannel) {
            const executor = message.author;
            const logEmbed = new MessageEmbed()
                .setAuthor(executor.tag, executor.displayAvatarURL({ dynamic: true }))
                .setDescription(`**طرد عضو**\n\n**العضو : <@${member.user.id}>**\n**بواسطة : ${executor}**\n\`\`\`Reason : ${kickReason}\`\`\``)
                .setColor('#493042')
                .setFooter(member.user.tag, member.user.displayAvatarURL({ dynamic: true }));
            logChannel.send({ embeds: [logEmbed] });
        }

        message.reply(`**✅ ${member} Kicked from the server! ✈️.**`);
    }
};