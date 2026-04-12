const { owners, prefix } = require(`${process.cwd()}/config`);
module.exports = {
    name: 'checkvc',
    run: (client, message) => {
        const Pro = require(`pro.db`);
        const db = Pro.get(`Allow - Command check = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('ADMINISTRATOR') && !message.member.permissions.has('MANAGE_ROLES') && !owners.includes(message.author.id) ) {
            return message.react('❌');
        }




        const args = message.content.split(' ');
        const roleId = args[1];
        const role = message.guild.roles.cache.find(e => e.id === roleId || e.name === roleId || `<@&${e.id}>` === roleId);

        if (!role) {
            return message.reply({ content: `**يرجى ارفاق منشن الرول او الايدي **` });
        }

        const roleMembers = Array.from(role.members.values());
        const roleMemberCount = roleMembers.length;
        const firstFiveMembers = roleMembers.slice(0, 25).map((member, index) => {
            const voiceEmoji = member.voice.channel ? '🔊' : '';
            return `${index + 1}- <@${member.user.id}> ${voiceEmoji}`;
        }).join("\n");

        const remainingMembers = roleMembers.slice(25);
        const remainingMembersString = remainingMembers.map((member, index) => {
            const voiceEmoji = member.voice.channel ? '🔊' : '';
            return `${index + 26}- <@${member.user.id}> ${voiceEmoji}`;
        }).join("\n");

        const voiceChannelCount = roleMembers.filter(member => member.voice.channel).length; 

        message.channel.send({ content: `**الرول يحتوي على : \`${roleMemberCount}\` \nالمتواجدين بالرومات : \`${voiceChannelCount}\` \n${firstFiveMembers}**` });

        if (remainingMembers.length > 0) {
            message.channel.send({ content: `**${remainingMembersString}**` });
        }
    }
};
