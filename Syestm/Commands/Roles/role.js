const { MessageEmbed } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'role',
  aliases: ["رول", "give", "r"],

  run: async (client, message, args) => {
    const guildColor = db.get(`Guild_Color = ${message.guild.id}`) || message.guild.me.displayHexColor || `#000000`;
    const allowDb = db.get(`Allow - Command role = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    
    const logChannelId = db.get(`Log_Channel_Id_${message.guild.id}`);
    const logChannel = logChannelId ? message.guild.channels.cache.get(logChannelId) : null;

    // Check if the user has permission to use the command
    const isAuthorAllowed = 
      message.member.roles.cache.has(allowedRole?.id) || 
      message.author.id === allowDb || 
      message.member.permissions.has('MANAGE_ROLES');

    if (!isAuthorAllowed) {
      return replyWithEmbed(message, guildColor, '❌ You do not have permission to use this command.');
    }

    if (message.author.bot) return;

    // Ensure at least 2 arguments are provided
    if (args.length < 2) {
      const aliasString = module.exports.aliases.join(", "); 
      const embed = new MessageEmbed()
        .setColor("#000000")
        .setTitle("Command: role")
        .setDescription("Add/remove a role(s) for a user or all members.")
        .addField("Aliases:", aliasString || "None")
        .addField("Usage:", `${prefix}role [user/all] (+/-)[roles names separated by comma]`)
        .addField("Examples:", 
          `${prefix}role all +roleName1, -roleName2\n` +
          `${prefix}role @user +role1, +role2\n` +
          `${prefix}role username +role id\n` +
          `${prefix}role all +role mention`
        );
        
      return message.reply({ embeds: [embed] });
    }

    const userArg = args[0];
    const rolesArgs = args.slice(1).join(" ").split(',');

    // Use Sets to store unique role names and user IDs
    const rolesAdded = new Set();
    const rolesRemoved = new Set();
    const usersAdded = new Set();
    const usersRemoved = new Set();

    // Enhanced role search function
    function findRole(roleArg) {
      roleArg = roleArg.trim();
      
      // Remove + or - from the start if present
      const action = roleArg.charAt(0) === '+' || roleArg.charAt(0) === '-' ? roleArg.charAt(0) : '+';
      roleArg = roleArg.replace(/^[+-]/, '').trim();

      // Try to find role by different methods
      let role = null;

      // 1. Try by role mention
      if (roleArg.match(/<@&(\d+)>/)) {
        const roleId = roleArg.match(/<@&(\d+)>/)[1];
        role = message.guild.roles.cache.get(roleId);
      }
      
      // 2. Try by role ID
      if (!role && roleArg.match(/^\d+$/)) {
        role = message.guild.roles.cache.get(roleArg);
      }
      
      // 3. Try exact name match
      if (!role) {
        role = message.guild.roles.cache.find(r => 
          r.name.toLowerCase() === roleArg.toLowerCase()
        );
      }
      
      // 4. Try partial name match
      if (!role) {
        role = message.guild.roles.cache.find(r => 
          r.name.toLowerCase().includes(roleArg.toLowerCase())
        );
      }

      return { role, action };
    }

    // Check if command is for 'all' members
    if (userArg.toLowerCase() === "all") {
      for (const roleArg of rolesArgs) {
        const { role, action } = findRole(roleArg);

        if (!role) {
          return replyWithEmbed(message, 'RED', `:rolling_eyes: **Role "${roleArg.replace(/^[+-]/, '')}" not found!**`);
        }

        if (message.guild.me.roles.highest.position <= role.position) {
          return replyWithEmbed(message, 'RED', `:rolling_eyes: **Role "${role.name}"'s position is higher than mine!**`);
        }

        const members = message.guild.members.cache.filter(member => !member.user.bot);

        for (const member of members.values()) {
          try {
            if (action === '+') {
              if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role.id);
                rolesAdded.add(role.name);
                usersAdded.add(member.user.id);
                if (logChannel) {
                  await logChannel.send(`:heavy_plus_sign: Added role **${role.name}** to ${member}!`);
                }
              }
            } else if (action === '-') {
              if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role.id);
                rolesRemoved.add(role.name);
                usersRemoved.add(member.user.id);
                if (logChannel) {
                  await logChannel.send(`:heavy_minus_sign: Removed role **${role.name}** from ${member}!`);
                }
              }
            }
          } catch (err) {
            console.error(err);
            return replyWithEmbed(message, 'RED', `:rolling_eyes: **Error modifying roles!**`);
          }
        }
      }

      const addedUserCount = usersAdded.size;
      const removedUserCount = usersRemoved.size;

      const finalEmbedDesc = [
        ...Array.from(rolesRemoved).map(roleName => `:white_check_mark: Removed role **${roleName}** from **${removedUserCount}** member(s).`),
        ...Array.from(rolesAdded).map(roleName => `:heavy_plus_sign: Added role **${roleName}** to **${addedUserCount}** member(s).`),
        (addedUserCount === 0 && removedUserCount === 0) ? `🔹 **No roles were added or removed.**` : ''
      ].filter(Boolean).join('\n');

      return replyWithEmbed(message, '#03ac13', finalEmbedDesc);

    } else {
      // Enhanced user search
      let user = message.mentions.members.first();
      
      if (!user) {
        // Try finding by ID
        if (userArg.match(/^\d+$/)) {
          user = message.guild.members.cache.get(userArg);
        }
        
        // Try finding by username or tag
        if (!user) {
          user = message.guild.members.cache.find(member =>
            member.user.username.toLowerCase() === userArg.toLowerCase() ||
            member.user.tag.toLowerCase() === userArg.toLowerCase() ||
            member.displayName.toLowerCase() === userArg.toLowerCase()
          );
        }
      }

      if (!user) {
        return replyWithEmbed(message, 'RED', `:rolling_eyes: **I can't find this member!**`);
      }

      const userRolesAdded = new Set();
      const userRolesRemoved = new Set();

      for (const roleArg of rolesArgs) {
        const { role, action } = findRole(roleArg);

        if (!role) {
          return replyWithEmbed(message, 'RED', `:rolling_eyes: **Role "${roleArg.replace(/^[+-]/, '')}" not found!**`);
        }

        if (message.guild.me.roles.highest.position <= role.position) {
          return replyWithEmbed(message, 'RED', `:rolling_eyes: **Role "${role.name}"'s position is higher than yours!**`);
        }

        try {
          if (action === '-' && user.roles.cache.has(role.id)) {
            await user.roles.remove(role.id);
            rolesRemoved.add(role.name);
            userRolesRemoved.add(role.name);
            usersRemoved.add(user.user.id);
            if (logChannel) {
              await logChannel.send(`:heavy_minus_sign: Removed role **${role.name}** from ${user}!`);
            }
          } else if (action === '+' && !user.roles.cache.has(role.id)) {
            await user.roles.add(role.id);
            rolesAdded.add(role.name);
            userRolesAdded.add(role.name);
            usersAdded.add(user.user.id);
            if (logChannel) {
              await logChannel.send(`:heavy_plus_sign: Added role **${role.name}** to ${user}!`);
            }
          }
        } catch (err) {
          console.error(err);
          return replyWithEmbed(message, 'RED', `:rolling_eyes: **There was an error modifying the role "${role.name}".**`);
        }
      }

      const userName = user.user.username;
      const rolesAddedString = userRolesAdded.size ? `**+${Array.from(userRolesAdded).join(", ")}.**` : '';
      const rolesRemovedString = userRolesRemoved.size ? `**-${Array.from(userRolesRemoved).join(", ")}.**` : '';

      const finalEmbedDesc = [
        `✅ Changed roles for ${userName}.`,
        rolesAddedString,
        rolesRemovedString,
      ].filter(Boolean).join(' ');

      return replyWithEmbed(message, '#32cd32', finalEmbedDesc);
    }
  }
};

function replyWithEmbed(message, color, description) {
  const embed = new MessageEmbed()
    .setColor(color)
    .setDescription(description);
  
  return message.reply({ embeds: [embed] });
}