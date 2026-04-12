const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'sechard',
    description: "تعيين الإعدادات الحماية القصوى",
    usage: "!sechard <value>", // Replace `!` with your prefix
    run: async (client, message, args) => {
        // Check if the user is an owner
        if (!owners.includes(message.author.id)) {
            return message.react('❌');
        }

        // Ensure the command is used in a guild (server)
        if (!message.guild) {
            return;
        }

        // Check if a value is provided
        if (args.length < 1) {
            return message.reply("يرجى تحديد 'on' أو 'off' لتفعيل أو إلغاء تفعيل جميع الإعدادات.");
        }

        const value = args[0].toLowerCase();

        // If the value is "on", enable all protections
        if (value === 'on') {
            db.set(`antibots_${message.guild.id}`, true);
            db.set(`anticreate_${message.guild.id}`, true);
            db.set(`antidelete_${message.guild.id}`, true);
            db.set(`antijoinPunishment_${message.guild.id}`, true);
            db.set(`antilink_${message.guild.id}`, true);
            db.set(`spamProtectionEnabled_${message.guild.id}`, true);
            db.set(`antiWebhook_${message.guild.id}`, true);
            db.set(`antiPerms_${message.guild.id}`, true);
            db.set(`antiServerAvatar_${message.guild.id}`, true);
            db.set(`antiServerName_${message.guild.id}`, true);

            return message.reply("تم تفعيل الحماية القصوى!");
        } 
        
        // If the value is "off", disable all protections
        else if (value === 'off') {
            db.set(`antibots_${message.guild.id}`, false);
            db.set(`anticreate_${message.guild.id}`, false);
            db.set(`antidelete_${message.guild.id}`, false);
            db.set(`antijoinPunishment_${message.guild.id}`, false);
            db.set(`antilink_${message.guild.id}`, false);
            db.set(`spamProtectionEnabled_${message.guild.id}`, false);
            db.set(`antiWebhook_${message.guild.id}`, false);
            db.set(`antiPerms_${message.guild.id}`, false);
            db.set(`antiServerAvatar_${message.guild.id}`, false);
            db.set(`antiServerName_${message.guild.id}`, false);

            return message.reply("تم إلغاء تفعيل الحماية القصوى!");
        }
        
        // If the input is invalid
        else {
            return message.reply("يرجى استخدام 'on' أو 'off' لتفعيل أو إلغاء تفعيل جميع الإعدادات.");
        }
    }
};