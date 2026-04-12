const { MessageEmbed } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");
const moment = require("moment");

module.exports = {
    name: "plist",
    description: "عرض قائمة الأشخاص الذين يمتلكون صلاحية فك أي عقوبة.",
    run: async (client, message) => {
		        if (!owners.includes(message.author.id)) {
            return message.react('❌');
        }
        const allowedMembers = Pro.get(`allowed_unpunish_${message.guild.id}`) || [];
        if (allowedMembers.length === 0) {
            return message.reply("لا يوجد أعضاء لديهم صلاحية فك العقوبات.");
        }

        const memberList = allowedMembers.map(id => `<@${id}>`).join("\n");
        const embed = new MessageEmbed()
            .setColor("#000000")
            .setTitle("عرض قائمة الأشخاص الذين يمتلكون صلاحية فك أي عقوبة")
            .setDescription(memberList)
            .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
