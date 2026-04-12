const { MessageEmbed } = require("discord.js");
const Data = require('pro.db');

module.exports = {
    name: "removetask",
    description: "إزالة مهمة إدارية",
    run: async (client, message, args) => {
        if (!message.member.permissions.has('ADMINISTRATOR')) 
            return message.reply('لا تملك الصلاحيات المطلوبة لإزالة المهام.');

        const taskInput = args.join(" ");
        if (!taskInput || taskInput.trim() === '') 
            return message.reply('يرجى إدخال المهمة التي تريد إزالتها. مثل: /removetask تنظيف القاعات');

        let tasks = Data.get(`tasks_${message.guild.id}`) || [];
        if (tasks.length === 0) 
            return message.reply('لا توجد مهام محددة حتى الآن.');

        let removedTask = null;
        let isNumber = !isNaN(taskInput);

        if (isNumber) {
            const index = parseInt(taskInput) - 1; // Convert to zero-based index
            if (index < 0 || index >= tasks.length) 
                return message.reply('الرقم المقدم غير صحيح أو خارج النطاق.');
            removedTask = tasks.splice(index, 1)[0];
        } else {
            const taskToRemove = taskInput.toLowerCase();
            const index = tasks.findIndex(task => task.toLowerCase() === taskToRemove);
            if (index === -1) 
                return message.reply('المهمة المحددة غير موجودة.');
            removedTask = tasks.splice(index, 1)[0];
        }

        Data.set(`tasks_${message.guild.id}`, tasks);

        const embed = new MessageEmbed()
            .setTitle("المهام الإدارية")
            .setDescription(`**تم إزالة المهمة: ${removedTask}**\n\nالمهام المتبقية:`)
            .setColor("#00FF00");

        if (tasks.length > 0) {
            let taskList = tasks.map((task, idx) => `${idx + 1}. ${task}`).join("\n");
            embed.addField("قائمة المهام", taskList);
        } else {
            embed.setDescription(`**تم إزالة المهمة: ${removedTask}**\n\nلا توجد مهام متبقية.`);
        }

        return message.channel.send({ embeds: [embed] });
    },
};