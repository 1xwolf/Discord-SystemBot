const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { owners } = require(`${process.cwd()}/config`);
const db = require(`pro.db`);

module.exports = {
    name: "imagechat",
    description: "To set Url room",
    usage: "!set-Url <Url>",
    run: async (client, message) => {
        if (!owners.includes(message.author.id)) return message.react('❌');

        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        let Url = "";
        let imageName = "";

        if (message.content.includes("http")) {
            Url = message.content.split(" ")[1];
            imageName = "colors.png"; // Use png format for the image
        } else if (message.attachments.size > 0) {
            Url = message.attachments.first().url;
            imageName = "colors.png"; // Use png format for the image
        } else {
            return message.reply({ content: "**يرجى ارفاق رابط الصورة.**" });
        }

        const imagePath = path.join(process.cwd(), "Fonts", imageName);

        // Download the image
        const response = await fetch(Url);
        const buffer = await response.buffer();

        // Save the image to the specified directory
        fs.writeFileSync(imagePath, buffer);

        db.set(`Url = [ Colors ]`, imagePath); // Save the path to the image in the database
        message.react("✅");
    }
};
