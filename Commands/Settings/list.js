const Pro = require(`pro.db`);
const db = require(`pro.db`);
const { MessageEmbed } = require(`discord.js`);
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: `al`,
    aliases: ["سماح"],
    run: async function (client, message) {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
    


        const Color = db.get(`Guild_Color = ${message.guild.id}`) || message.guild.me.displayHexColor || `#f5f5ff`;
        if (!Color) return;

        if (!owners.includes(message.author.id)) return message.react(`❌`);
        const Args = message.content.split(` `);
        if (!Args[1]) return message.reply({ content: `**يرجى ارفاق منشن او ايدي العضو او رول .**` });

        const Embed = new MessageEmbed();
        const Roles = message.guild.roles.cache.find((role) => role.id === Args[2]) || message.mentions.roles.first();
        if (Roles) {
            const permissionKey = `Allow - Command ${Args[1]} = [ ${message.guild.id} ]`;
            const existingPermission = Pro.get(permissionKey);
            if (existingPermission) {
                Pro.delete(permissionKey);
                Embed.setDescription(`**تم حذف صلاحية ${Roles} ${Args[1]}**`);
            } else {
                Pro.set(permissionKey, Roles.id);
                Embed.setDescription(`**تم منح ${Roles} صلاحية ${Args[1]}**`);
            }
            Embed.setColor(`${Color || message.guild.me.displayHexColor || `#f5f5ff`}`);
            message.reply({ embeds: [Embed] });
        }

        const Member = message.guild.members.cache.find((role) => role.id === Args[2]) || message.mentions.members.first();
        if (Member) {
            const permissionKey = `Allow - Command ${Args[1]} = [ ${message.guild.id} ]`;
            const existingPermission = Pro.get(permissionKey);
            if (existingPermission) {
                Pro.delete(permissionKey);
                Embed.setDescription(`**تم حذف صلاحية ${Member} ${Args[1]}**`);
            } else {
                Pro.set(permissionKey, Member.id);
                Embed.setDescription(`**تم منح ${Member} صلاحية **${Args[1]}`);
            }
            Embed.setColor(`${Color || message.guild.me.displayHexColor || `#f5f5ff`}`);
            message.reply({ embeds: [Embed] });
        }
    }
};
