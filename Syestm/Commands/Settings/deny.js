const Pro = require(`pro.db`);
const { MessageEmbed } = require(`discord.js`);
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: `deny`,
    aliases: ["حذف"],
    run: async function (client, message) {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }


        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        
        if (!Color) return;


        const Args = message.content.split(` `);

        if (!Args[1]) {
            const Embed = new MessageEmbed()
                .setColor(Color)
                .setDescription(`**يرجى استخدام الأمر بالطريقة الصحيحة .**\n${prefix}deny mute <@${message.author.id}>`);

            return message.reply({ embeds: [Embed] });
        }

        const Embed = new MessageEmbed();

        const Roles = message.guild.roles.cache.get(Args[2]) || message.mentions.roles.first();
        const Member = message.guild.members.cache.get(Args[2]) || message.mentions.members.first();

        if (Roles || Member) {
            const permissionKey = `Allow - Command ${Args[1]} = [ ${message.guild.id} ]`;
            const existingPermission = Pro.get(permissionKey);

            if (existingPermission) {
                Pro.delete(permissionKey);
                Embed.setColor(Color)
                Embed.setDescription(`**تم إزالة صلاحية ${Roles || Member} ${Args[1]}**`);
            } else {
                Embed.setColor(Color)
                Embed.setDescription(`**${Roles || Member} لا يمتلك صلاحية ${Args[1]} لإزالتها.**`);
            }
        } else {
            return message.reply({ content: `**يرجى ارفاق منشن صحيح للرول أو العضو.**` });
        }

        Embed.setColor(Color);
        return message.reply({ embeds: [Embed] });
    }
};
