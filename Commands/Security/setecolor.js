const {owners } = require(`${process.cwd()}/config`);
const db = require(`pro.db`)
module.exports = {
    name: "setecolor",
    run: async (Client, interaction, args) => {


        const Data = db.get(`Allow - Command setecolor = [ ${interaction.guild.id} ]`)
const allowedRole = interaction.guild.roles.cache.get(Data);
const isAuthorAllowed = interaction.member.roles.cache.has(allowedRole?.id);
const isOwner = owners.includes(interaction.author.id);

if (!isAuthorAllowed && interaction.author.id !== Data && !isOwner) {
    // إجراءات للتصرف عندما لا يتحقق الشرط
    return interaction.react('❌');
}
      
        const Args = interaction.content.split(` `)
        const Color = Args[1];
       // if(!interaction.member.permissions.has(`ADMINISTRATOR`)) return;
        if (!Color || !isNaN(parseInt(Args))) return await interaction.reply({ content: `**يرجي وضع كود اللون ⛔️ . **` });
        await db.set(`Guild_Color = ${interaction.guild.id}`, `${Color}`)
        await interaction.react('✅')
    }
}
 