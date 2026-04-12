const {owners } = require(`${process.cwd()}/config`);
module.exports = {
    name: 'setname', // هنا اسم الامر
    run : (client, message, args) => {


        const Pro = require(`pro.db`)
        const db = Pro.get(`Allow - Command setname = [ ${message.guild.id} ]`)
const allowedRole = message.guild.roles.cache.get(db);
const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
const isOwner = owners.includes(message.author.id);

if (!isAuthorAllowed && message.author.id !== db && !isOwner) {
    // إجراءات للتصرف عندما لا يتحقق الشرط
    return message.react(`❌`);
}

      
  let a5rgs = message.content.split(" ");
// if (!owners.includes(message.author.id)) return;
  let name = a5rgs.slice(1).join(" "); {
  if (!name) return message.reply( `⛔️ **يرجى ارفاق الاسم الجديد .**`);
  client.user.setUsername(`${name}`);
  message.react(`✅`)
  }
    }
}


