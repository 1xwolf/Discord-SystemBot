const { loadReactionRoles } = require('../../reactionRoleHandler');

module.exports = async (client, channel) => {
  if (channel.isText()) {
    await loadReactionRoles(channel.guild, require('pro.db'));
  }
};
