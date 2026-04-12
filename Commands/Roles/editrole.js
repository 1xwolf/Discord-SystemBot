const { MessageEmbed } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'editrole',
  aliases: ["editrol", "er"],
  
  run: async (client, message, args) => {
    const guildColor = db.get(`Guild_Color = ${message.guild.id}`) || message.guild.me.displayHexColor || `#000000`;
    const allowDb = db.get(`Allow - Command editrole = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);

    // Check if the user has permission to use the command
    const isAuthorAllowed = 
      message.member.roles.cache.has(allowedRole?.id) || 
      message.author.id === allowDb || 
      message.member.permissions.has('MANAGE_ROLES');

    if (!isAuthorAllowed) {
      return replyWithEmbed(message, guildColor, '❌ You do not have permission to use this command.');
    }

    if (message.author.bot) return;

    // Ensure the command has at least 2 arguments
    if (args.length < 2) {
      const aliasString = module.exports.aliases.join(", ");
      const embed = new MessageEmbed()
        .setColor(guildColor)
        .setTitle("Command: editrole")
        .setDescription("Edit the name of an existing role in the server.")
        .addField("Aliases:", aliasString || "None")
        .addField("Usage:", `${prefix}editrole [role name] [new name]`)
        .addField("Example:", `${prefix}editrole oldRoleName newRoleName`);

      return message.reply({ embeds: [embed] });
    }

    const roleName = args[0];
    const newRoleName = args.slice(1).join(" ");

    // Find the role to edit
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());

    if (!role) {
      return replyWithEmbed(message, 'RED', `:rolling_eyes: **Role "${roleName}" not found!**`);
    }

    // Check if the bot has permission to manage roles
    if (message.guild.me.roles.highest.position <= role.position) {
      return replyWithEmbed(message, 'RED', `:rolling_eyes: **I cannot edit "${roleName}" because it is higher than my highest role!**`);
    }

    // Proceed to edit the role name
    try {
      await role.setName(newRoleName);
      return replyWithEmbed(message, 'GREEN', `✅ Successfully changed the role name from "${roleName}" to "${newRoleName}".`);
    } catch (err) {
      console.error(err);
      return replyWithEmbed(message, 'RED', `:rolling_eyes: **There was an error changing the role name.**`);
    }
  }
};

// Utility function to send an embed reply
function replyWithEmbed(message, color, description) {
  const embed = new MessageEmbed()
    .setColor(color)
    .setDescription(description);
  
  return message.reply({ embeds: [embed] });
}