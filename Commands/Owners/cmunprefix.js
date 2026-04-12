const fs = require("fs");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'cmunprefix',
    run: async (client, message, args) => {
        if (!owners.includes(message.author.id)) return message.react('❌');
                const newPrefix = "";
        fs.readFile("./config.json", (err, data) => {
            if (err) console.log(err);
         const config = JSON.parse(data);
            config.prefix = newPrefix;
                        fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
                if (err) console.log(err);
            });
            message.react(`✅`);
        });
    }
};