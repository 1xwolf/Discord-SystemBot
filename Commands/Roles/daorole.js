const fs = require("fs");
const db = require("pro.db")
const { owners, prefix } = require(`${process.cwd()}/config`);
module.exports = {
    name: 'daorole',
    run: (client, message) => {

        if (!owners.includes(message.author.id) && !message.member.permissions.has('MANAGE_ROLES')) return message.react('❌');


        if (message.author.bot || !message.guild) return message.react("❌");

        db.delete(`autorole_${message.guild.id}`);

        message.react("✅");
    }
};
