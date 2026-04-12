const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const Data = require('pro.db'); // تأكد من أنك قد قمت بإضافة مكتبة pro.db

// عرض المهام الإدارية
module.exports = {
    name: "task",
    description: "عرض المهام الإدارية",
    run: async (client, message, args) => {
        const tasks = Data.get(`tasks_${message.guild.id}`) || [];

        if (tasks.length === 0) {
            return message.reply('لا توجد مهام إدارية محددة في هذا السيرفر.');
        }

        const embed = new MessageEmbed()
            .setTitle("المهام الإدارية")
            .setDescription(tasks.map((t, i) => `${i + 1}. ${t}`).join("\n"))
            .setColor("BLUE");

        return message.reply({ embeds: [embed] });
    },
};