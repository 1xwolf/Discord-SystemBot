const { MessageEmbed } = require('discord.js');
const { owners, prefix } = require(`${process.cwd()}/config`);
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fetch = require('node-fetch'); // Ensure that the fetch module is included for image retrieval

let lastUpdate = {}; // To keep track of the last update timestamps for users

module.exports = {
    name: 'setbanner',
    aliases: ['sebn'],
    run: async function (client, message) {
        // Check if the command is used by an authorized user
        if (!owners.includes(message.author.id)) {
            return message.reply("You do not have permission to use this command.");
        }

        const userId = message.author.id;
        const now = Date.now();
        const cooldownTime = 300000; // Set the cooldown time (e.g., 5 minutes)

        // Check if the user is on cooldown
        if (lastUpdate[userId] && now - lastUpdate[userId] < cooldownTime) {
            const timeLeft = Math.ceil((cooldownTime - (now - lastUpdate[userId])) / 1000);
            return message.reply(`You are changing your banner too fast. Please wait ${timeLeft} seconds before trying again.`);
        }

        try {
            // Check if there are any attachments
            let bannerURL = null;
            if (message.attachments.size) {
                const bannerAttachment = message.attachments.first();
                bannerURL = bannerAttachment.url;
                if (!validateImageType(bannerAttachment.contentType)) {
                    return message.reply("Please submit a valid GIF, PNG, or JPEG format for banners.");
                }
            } else {
                await message.reply("Please send the new banner as a URL.");
                const filter = (m) => m.author.id === message.author.id && (m.attachments.size > 0 || /^https?:\/\/\S+\.\S+/.test(m.content));
                const response = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });

                if (response.size === 0) {
                    return message.reply("No response received, banner not updated.");
                }

                bannerURL = response.first().attachments.size > 0 ? response.first().attachments.first().url : response.first().content;

                // Validate the image types
                if (!await validateImageTypeByUrl(bannerURL)) {
                    return message.reply("Please submit a valid GIF, PNG, or JPEG format for banners.");
                }
            }

            // Fetch the image buffer from the URL
            const buffer = await fetch(bannerURL).then(res => res.buffer());

            // Prepare to make an API call to update the user's banner
            const rest = new REST({ version: '9' }).setToken(client.token);

            // Make the REST API call to update the banner
            await rest.patch(Routes.user(), {
                body: {
                    banner: `data:image;base64,${buffer.toString('base64')}`
                }
            });

            // Update the last update time
            lastUpdate[userId] = now;

            // Create and send a success message
            const embed = new MessageEmbed()
                .setColor("BLURPLE")
                .setDescription("Your banner has been successfully updated!");
            return await message.channel.send({ embeds: [embed] });
        } catch (error) {
            // Handle errors if the operation fails
            console.error(error);
            if (error.message.includes("rate limit")) {
                return message.reply("You are changing your banner too fast. Try again later.");
            }
            return message.reply(`An error occurred while updating the banner: \`${error.message}\``);
        }
    }
};

// Function to validate image type from URL
async function validateImageTypeByUrl(url) {
    const validImageTypes = ["image/gif", "image/png", "image/jpeg"];
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");
    return validImageTypes.includes(contentType);
}

function validateImageType(contentType) {
    const validImageTypes = ["image/gif", "image/png", "image/jpeg"];
    return validImageTypes.includes(contentType);
}