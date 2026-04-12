const { loadReactionRoles } = require('../../reactionRoleHandler');

module.exports = async (client, guild) => {
  console.log(`[ReactionRoles] Joined guild: ${guild.name}`);
  await loadReactionRoles(guild, require('pro.db'));
};
