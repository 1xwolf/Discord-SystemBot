const Pro = require('pro.db');

module.exports = {
  name: 'clear',
  aliases: ['مسح'],
  run: async (client, message, args) => {
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    const db = Pro.get(`Allow - Command clear = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = allowedRole && message.member.roles.cache.has(allowedRole.id);

    // Check if the author has permission (includes admin checks)
    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_MESSAGES')) {
      return message.reply('You do not have permission to use this command.').then(msg => setTimeout(() => msg.delete(), 3000));
    }

    // Check bot permissions
    if (!message.guild.me.permissions.has('MANAGE_MESSAGES')) {
      return message.reply('I do not have permission to manage messages.').then(msg => setTimeout(() => msg.delete(), 3000));
    }

    // Delete the invoking command message
    await message.delete().catch(err => console.error(err));

    let messageCount = parseInt(args[0], 10);
    if (messageCount > 100) {
      return message.channel.send('I can\'t delete more than 100 messages').then(msg => setTimeout(() => msg.delete(), 1000));
    }
    if (!messageCount || messageCount <= 0) messageCount = 100;

    try {
      let fetchedMessages;
      if (message.mentions.users.size > 0) {
        const mentionedUser = message.mentions.users.first();
        fetchedMessages = await message.channel.messages.fetch({ limit: messageCount });
        fetchedMessages = fetchedMessages.filter(msg => msg.author.id === mentionedUser.id);
      } else {
        fetchedMessages = await message.channel.messages.fetch({ limit: messageCount });
      }

      if (fetchedMessages.size === 0) {
        return message.reply('There are no messages to delete.').then(msg => setTimeout(() => msg.delete(), 3000));
      }

      const deletedMessages = await message.channel.bulkDelete(fetchedMessages, true);
      const msgSize = deletedMessages.size;
      const channelMessage = Pro.get(`channelmessage_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.find(c => c.id === channelMessage);

      // Log deleted message details to the specified channel
      if (logChannel) {
        let logContent = deletedMessages.map(msg => `${msg.author.username}: ${msg.content}`).join('\n');
        if (logContent.length > 2000) {
          logContent = logContent.slice(0, 1997) + '...'; // Trimming log content if too long
        }
        
        if (logContent) { // Check to ensure there's log content to send
          await logChannel.send({
            files: [{
              attachment: Buffer.from(logContent),
              name: 'deleted.txt'
            }]
          });
        }
      }

      // Send confirmation reply with the count of deleted messages to the command author
      const confirmationMessage = await message.reply(`Deleted ${msgSize} messages.`);
      setTimeout(() => confirmationMessage.delete(), 3000); // Deleting the confirmation message after 3 seconds

    } catch (err) {
    }
  }
};