// index.js

const { glob } = require("glob");
const { promisify } = require("util");
const fs = require('fs');
const globPromise = promisify(glob);
const Data = require("pro.db");



module.exports = async (client) => {
    const commandFiles = await globPromise(`${process.cwd()}/Commands/**/*.js`);
    commandFiles.map((value) => {
        const file = require(value);
        const splitted = value.split("/");
        const directory = splitted[splitted.length - 2];

        const isEnabled = Data.get(`command_enabled_${file.name}`);
        if (isEnabled === false) return; 

        if (file.name) {
            const properties = { directory, ...file };
            client.commands.set(file.name, properties);

            // تحقق من حالة التشغيل للـ aliases
            if (file.aliases && Array.isArray(file.aliases)) {
                file.aliases.forEach(alias => {
                    const aliasIsEnabled = Data.get(`command_enabled_${alias}`);
                    if (aliasIsEnabled === false) return; 
                    client.commands.set(alias, properties);
                });
            }
        }
    });


    
    const eventFiles = await globPromise(`${process.cwd()}/events/*.js`);
    eventFiles.map((value) => require(value));

    fs.readdirSync('./Extras/Guild/').filter(file => file.endsWith('.js')).forEach(file => {
        require(`../Extras/Guild/${file}`);
    });
};
