const { MessageEmbed } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  name: "color",
  aliases: ["لون"],
  description: "to choose a specific color",
  cooldown: [10],
  ownerOnly: false,
  run: async (client, message, args) => {
    if (!args[0]) {
      return message.reply("**يُرجى كتابة رقم اللون بعد الأمر.**");
    }

    const allowedColors = Array.from({ length: 200 }, (_, i) => (i + 1).toString());

    // If the user selects color `0`
    if (args[0] === "0") {
      const memberRoles = message.member.roles.cache.filter(role => allowedColors.includes(role.name.toLowerCase()));

      if (memberRoles.size === 0) {
        return message.channel.send("**ليس لديك أدوار ألوان لإزالتها!**");
      }

      // Remove existing color roles
      memberRoles.forEach(role => {
        message.member.roles.remove(role).then(() => {
          // Only shows this message when the role is removed due to selecting '0'
        }).catch(error => {
          console.error(`Failed to remove role: ${role.name}, Error: ${error}`);
        });
      });

      // Notify the user that their color has been removed
      return message.reply("**تم إزالة اللون الخاص بك.**");
    }

    if (!allowedColors.includes(args[0])) {
      return message.channel.send("**اللون الذي اخترته غير موجود**");
    }

    let newColorRole = message.guild.roles.cache.find(role => {
      return role.name.toLowerCase() === `${args.join(" ").toLowerCase()}`;
    });

    if (!newColorRole) {
      return message.channel.send("**الرقم المدخل للون غير موجود**");
    }

    if (!newColorRole.editable) {
      return message.channel.send("**ليس لدي أذونات للتعديل/منح هذا الدور!**");
    }

    // Remove existing color roles except for the new one
    const memberRoles = [...message.member.roles.cache.values()];
    memberRoles.forEach(role => {
      if (allowedColors.includes(role.name.toLowerCase()) && args.join(" ").toLowerCase() !== role.name.toLowerCase()) {
        message.member.roles.remove(role).catch(error => {
          console.error(`Failed to remove role: ${role.name}, Error: ${error}`);
        });
      }
    });

    // Add the new color role
    await message.member.roles.add(newColorRole).then(() => {
      let embed = new Discord.MessageEmbed()
        .setDescription(`**${message.member.user} تم تغيير اللون بنجاح (${newColorRole.name}) ✅**`)
        .setColor(newColorRole.color);

      return message.channel.send({ embeds: [embed] });
    }).catch(error => {
      console.error(`Failed to add new color role. Error: ${error}`);
      return message.channel.send(`An error occurred while changing the color role.`);
    });
  }
};