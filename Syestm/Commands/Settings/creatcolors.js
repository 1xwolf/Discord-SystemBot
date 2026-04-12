const Pro = require(`pro.db`);
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'ctcolors',
  run: async (client, message) => {

    
    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

      
      const createdRoles = [];
      for (let i = 1; i <= 15; i++) {
          const roleName = `${i}`;
          const existingRole = message.guild.roles.cache.find(role => role.name === roleName);
          if (existingRole) {
              createdRoles.push(existingRole);
          } else {
              const randomColor = Math.floor(Math.random() * 16777215).toString(16);
              const createdRole = await message.guild.roles.create({
                  name: roleName,
                  color: randomColor
              });
              createdRoles.push(createdRole);
          }
      }
      message.react(`✅`);
  }
}
