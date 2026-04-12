const {owners } = require(`${process.cwd()}/config`);
module.exports = {
    name: 'uptime', // هنا اسم الامر
    run : (client, message, args) => {
        
        const Pro = require(`pro.db`)
        const db = Pro.get(`Allow - Command uptime = [ ${message.guild.id} ]`)
const allowedRole = message.guild.roles.cache.get(db);
const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
const isOwner = owners.includes(message.author.id);

if (!isAuthorAllowed && message.author.id !== db && !isOwner) {
    // إجراءات للتصرف عندما لا يتحقق الشرط
    return;
}
      
     if (message.author.bot) return;
    let uptime = client.uptime;
    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let notCompleted = true;
    while (notCompleted) {
          if (uptime >= 8.64e+7) {
            days++;
            uptime -= 8.64e+7;

        } else if (uptime >= 3.6e+6) {
            hours++;
            uptime -= 3.6e+6;
        } else if (uptime >= 60000) {
            minutes++;
            uptime -= 60000;
        } else if (uptime >= 1000) {
            seconds++;
            uptime -= 1000;
        }
        if (uptime < 1000)  notCompleted = false;
    }
    message.channel.send("`" + `${days} days, ${hours} hrs, ${minutes} , ${seconds} sec` + "`");

    }
}