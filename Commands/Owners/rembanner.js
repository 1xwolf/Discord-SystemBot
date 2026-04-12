const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'rembanner',
    aliases: ['rmbn'],
    run: async function (client, message) {
        // Check if the command is used by an authorized user
        if (!owners.includes(message.author.id)) {
            return message.reply("You do not have permission to use this command.");
        }

        try {
            // Prepare to make an API call to update the user's banner
            const rest = new REST({ version: '9' }).setToken(client.token);

            // Make the REST API call to remove the banner by setting it to null
            await rest.patch(Routes.user(), {
                body: {
                    banner: null
                }
            });

            // Create and send a success message
            return message.reply("Your banner has been successfully removed! ✅");
        } catch (error) {
            console.error(error);
            return message.reply(`An error occurred while removing the banner: \`${error.message}\``);
        }
    }
};