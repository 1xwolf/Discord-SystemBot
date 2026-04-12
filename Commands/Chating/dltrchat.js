const d8b = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: "dltrchat",
    description: "To delete the channel room",
    usage: "!delete-set-channel",
    run: async (client, message, args) => {
        const Pro = require(`pro.db`);
        
        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = d8b.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        // الحصول على قيمة الشات
        const evaluationChannelID = d8b.get(`setevaluation_${message.guild.id}`);

        if (evaluationChannelID) {
            // إذا كان هناك شات تقييمات محدد، قم بحذفه
            d8b.delete(`setevaluation_${message.guild.id}`);
            message.react(`✅`);
        } else {
            // إذا لم يكن هناك شات محدد، قم بإرسال رسالة reply
            message.reply("**لا يوجد شات تقييمات محفوظ إلي الآن**.");
        }
    }
};
