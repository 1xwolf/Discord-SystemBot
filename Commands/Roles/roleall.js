const { MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

module.exports = {
    name: 'allrole', // Command Name
    aliases: ["roleall"],
    cooldown: 10, // Cooldown in seconds

    run: async (client, message, args) => {
        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        const db = Pro.get(`Allow - Command allrole = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.react(`❌`);
        }

        const rrole = message.content.split(" ").slice(1).join(" ");
        const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name === rrole) || message.guild.roles.cache.find(r => r.id === rrole);
        if (!role) {
            const embed = new MessageEmbed()
                .setColor(`${Color || `#f5f5ff`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}roleall <@رول>**`);

            return message.reply({ embeds: [embed] });
        }

        // Check Bot's Permissions
        if (!message.guild.me.permissions.has('MANAGE_ROLES')) {
            return message.reply({ content: 'I need the **Manage Roles** permission to assign roles.' });
        }

        // Check if the role is manageable
        if (role.position >= message.guild.me.roles.highest.position) {
            return message.reply({ content: `I cannot assign this role because it is higher than my highest role.` });
        }

        // Confirmation message
        const confirmEmbed = new MessageEmbed()
            .setColor(Color)
            .setDescription(`هل تريد حقًا اعطاء هذا الرول ${role} لجميع الأعضاء؟ تفاعل مع ✅ للتأكيد.`);
        
        const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
        await confirmMessage.react('✅');
        await confirmMessage.react('❌');

        // Filter for reactions
        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        confirmMessage.awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] })
            .then(async collected => {
                const reaction = collected.first();

                if (reaction.emoji.name === '✅') {
                    let successfulCount = 0;

                    // Apply the role to all members
                    const members = message.guild.members.cache.filter(member => !member.roles.cache.has(role.id));
                    for (const m of members.values()) {
                        try {
                            await m.roles.add(role);
                            successfulCount++;
                        } catch (err) {
                            console.error(`Failed to add role to ${m.user.tag}: ${err}`);
                        }
                    }

                    message.reply({ content: `**تم اعطاء ${successfulCount} الأعضاء الرول ${role}.**` });

                    // Log to a specific channel if you have one set up
                    const logChannel = message.guild.channels.cache.find(ch => ch.name === 'log-channel'); // Change to your log channel
                    if (logChannel) {
                        logChannel.send(`**${message.author.tag} gave the role ${role.name} to ${successfulCount} members.**`);
                    }
                } else {
                    message.reply('Operation canceled.');
                }
            })
            .catch(() => {
                confirmMessage.edit('You did not react in time, operation canceled.');
            });
    }
}