const Data = require("pro.db");
module.exports = {
    name: 'ping', // هنا اسم الامر
    run : (client, message, args) => {
        
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

    message.reply(`my ping is **${client.ws.ping}** 🎯`);
    }
}


