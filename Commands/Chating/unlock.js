module.exports = {
    name: 'unlock', // اسم الأمر هنا
    aliases: ["فتح","ف"],
    run: async (client, message, args) => {
        const Pro = require('pro.db');
        const db = Pro.get(`Allow - Command unlock = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_CHANNELS')) {
            return message.reply(`:rolling_eyes: **You Don't Have Permissions To unlock this channel.**`);
        }

        const guildPermissions = message.guild.me.permissions.has("MANAGE_CHANNELS");
        const a7rgs = message.content.split(' ');
        const channel = message.mentions.channels.first() || client.channels.cache.get(a7rgs[1]) || message.channel;

        if (channel.permissionsFor(message.guild.roles.everyone).has('SEND_MESSAGES')) {
            return message.reply(`:x: **Channel is already unlocked** ${channel}.`);
        }

        if (!guildPermissions) {
            return message.reply(`:rolling_eyes: **I couldn't change the channel permissions. Please check my permissions.**`)
                .catch((err) => console.log(`Couldn't reply to the message: ${err.message}`));
        }

        const everyone = message.guild.roles.cache.find(role => role.name === '@everyone');
        await channel.permissionOverwrites.edit(everyone, {
            SEND_MESSAGES: true,
            SEND_MESSAGES_IN_THREADS: true,
            CREATE_PUBLIC_THREADS: true,
            CREATE_PRIVATE_THREADS: true
        });

        message.reply(`:unlock: ${channel} **has been unlocked.**`)
            .catch((err) => console.log(`Couldn't reply to the message: ${err.message}`));
    }
}