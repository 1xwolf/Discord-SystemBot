const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const db = require('pro.db');
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'cols',
    run: async (client, message, args) => {
        if (!owners.includes(message.author.id)) return message.react('❌');
        const Color = db.get(`Guild_Color_${message.guild.id}`) || '#5c5e64';

        if (!args[0]) {
            const allData = db.all();
            const allCollections = allData
                .map(item => item[0].split(' = ')[1])
                .filter(key => key.startsWith('collection_'));
        
            if (allCollections.length === 0) {
                return message.reply('لا يوجد أي مجموعات. قم بإنشاء مجموعة باستخدام `-col <اسم>`');
            }
        
            if (allCollections.length > 25) {
                return message.reply('تم الوصول إلى الحد الأقصى لعدد المجموعات (25 مجموعة).');
            }
            const Color = db.get(`Guild_Color_${message.guild.id}`) || '#5c5e64';

            // التحقق من وجود اللون
            if (!Color) {
                return;
            }
        
            // إعداد رسالة Embed لعرض أسماء المجموعات
            const embed = new MessageEmbed()
            .setColor(Color || '#5c5e64')
                .setDescription(
                   `**يرجى إرفاق اسم الكوليكشن مع الامر\n` +
        (allCollections.length > 0
            ? allCollections.map((name, index) => `${index + 1}. ${name.replace('collection_', '')}**`).join('\n')
            : 'لا توجد مجموعات.')
    );
        
            // إرسال رسالة Embed
            await message.channel.send({ embeds: [embed] });
        

            const options = allCollections.map(col => {
                const key = col.replace('collection_', '');
                return {
                    label: key,
                    value: col
                };
            });

            

         } else {

            const collectionName = args[0];
            await showCollectionPanel(client,collectionName, message, null, Color);
        }
    }
};

async function showCollectionPanel(client,collectionName, message, interaction, Color) {
    let collection = db.get(`collection_${collectionName}`);

    if (!collection) {
        collection = {
            allowedUsers: [],
            allowedRoles: [],
            rolesToRemove: [],
            enabled: false
        };
        db.set(`collection_${collectionName}`, collection);
    }

    const embedDescription = 'قم بإعداد المجموعة من خلال الأزرار أدناه.' || 'لا يوجد بيانات متاحة.';

    const embed = new MessageEmbed()
        .setTitle(`المجموعة: ${collectionName}`)
        .addFields(
            { name: 'الأعضاء المسموح بهم', value: collection.allowedUsers.length ? collection.allowedUsers.map(id => `<@${id}>`).join('\n') : 'لا يوجد', inline: true },
            { name: 'الرولات المسموح بها', value: collection.allowedRoles.length ? collection.allowedRoles.map(id => `<@&${id}>`).join('\n') : 'لا يوجد', inline: true },
            { name: 'الرولات الممنوعة', value: collection.rolesToRemove.length ? collection.rolesToRemove.map(id => `<@&${id}>`).join('\n') : 'لا يوجد', inline: true },
            { name: 'قابل للإزالة', value: collection.enabled ? 'مفعل' : 'معطل', inline: true }
        )
        .setColor(Color);

    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId('allowed_users')
            .setLabel('الأعضاء المسموح بهم')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('allowed_roles')
            .setLabel('الرولات المسموح بها')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('roles_to_remove')
            .setLabel('الرولات الممنوعة')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('on_off')
            .setLabel('قابل للإزالة')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('remove_collection')
            .setLabel('إزالة المجموعة')
            .setStyle('DANGER')
    );

    let panelMessage;

    if (interaction) {
        panelMessage = await interaction.channel.send({ embeds: [embed], components: [row], fetchReply: true });
    } else {
        panelMessage = await message.channel.send({ embeds: [embed], components: [row] });
    }

    const filter = (btnInteraction) => btnInteraction.user.id === message.author.id;
    const collector = panelMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (btnInteraction) => {

        if (btnInteraction.customId === 'allowed_users') {
            btnInteraction.deferUpdate();
            let m = await message.reply('يرحى ارفاق منشن العضو الان .');
            const userCollector = message.channel.createMessageCollector({ filter: m => m.author.id === message.author.id, time: 15000 });

            userCollector.on('collect', async (msg) => {
                const userIds = msg.content.split(' ').map(id => id.trim().replace(/[<@!>]/g, '')); 

                const addedUsers = [];
                const removedUsers = [];

                for (let id of userIds) {
                    const user = await client.users.fetch(id).catch(() => null); 
                    if (user) {
                        if (!collection.allowedUsers.includes(id)) {
                            collection.allowedUsers.push(id);
                            addedUsers.push(id);
                        } else {
                            collection.allowedUsers = collection.allowedUsers.filter(userId => userId !== id);
                            removedUsers.push(id);
                        }
                    }
                }

                db.set(`collection_${collectionName}`, collection);

                let description = '';
                if (addedUsers.length > 0) {
                    description += addedUsers.map(id => `✅ <@${id}>`).join('\n') + '\n';
                }
                if (removedUsers.length > 0) {
                    description += removedUsers.map(id => `☑️ <@${id}>`).join('\n') + '\n';
                }

                let actionEmbed = new MessageEmbed()
                    .setDescription(description)
                    .setColor(Color);

                await  btnInteraction.followUp({ embeds: [actionEmbed] , ephemeral:true});
                await m.delete();
                panelMessage.edit({ embeds: [await updateEmbedFunc(collectionName, collection, Color)] });
                userCollector.stop();
            });
        }

        if (btnInteraction.customId === 'allowed_roles') {
            btnInteraction.deferUpdate();
            let m = await message.reply('يرحى ارفاق منشن الرول الان .');
            const roleCollector = message.channel.createMessageCollector({ filter: m => m.author.id === message.author.id, time: 15000 });

            roleCollector.on('collect', async (msg) => {
                const roleIds = msg.content.split(' ').map(id => id.trim().replace(/[<@&>]/g, '')); 

                const addedRoles = [];
                const removedRoles = [];

                for (let id of roleIds) {
                    const role = message.guild.roles.cache.get(id); 
                    if (role) {
                        if (!collection.allowedRoles.includes(id)) {
                            collection.allowedRoles.push(id);
                            addedRoles.push(id);
                        } else {
                            collection.allowedRoles = collection.allowedRoles.filter(roleId => roleId !== id);
                            removedRoles.push(id);
                        }
                    }
                }

                db.set(`collection_${collectionName}`, collection);

                let description = '';
                if (addedRoles.length > 0) {
                    description += addedRoles.map(id => `✅ <@&${id}>`).join('\n') + '\n';
                }
                if (removedRoles.length > 0) {
                    description += removedRoles.map(id => `:ballot_box_with_check: <@&${id}>`).join('\n') + '\n';
                }

                let actionEmbed = new MessageEmbed()
                    .setDescription(description)
                    .setColor(Color);

                btnInteraction.followUp({ embeds: [actionEmbed] , ephemeral:true});
                await m.delete();
                panelMessage.edit({ embeds: [await updateEmbedFunc(collectionName, collection, Color)] });
                roleCollector.stop();
            });
        }

        if (btnInteraction.customId === 'roles_to_remove') {
            btnInteraction.deferUpdate();
            let m = await message.reply('يرحى ارفاق منشن الرول الان .');
            const removeCollector = message.channel.createMessageCollector({ filter: m => m.author.id === message.author.id, time: 15000 });

            removeCollector.on('collect', async (msg) => {
                const roleIds = msg.content.split(' ').map(id => id.trim().replace(/[<@&>]/g, '')); 

                const addedRoles = [];
                const removedRoles = [];

                for (let id of roleIds) {
                    const role = message.guild.roles.cache.get(id);
                    if (role) {
                        if (!collection.rolesToRemove.includes(id)) {
                            collection.rolesToRemove.push(id);
                            addedRoles.push(id);
                        } else {
                            collection.rolesToRemove = collection.rolesToRemove.filter(roleId => roleId !== id);
                            removedRoles.push(id);
                        }
                    }
                }

                db.set(`collection_${collectionName}`, collection);

                let description = '';
                if (addedRoles.length > 0) {
                    description += addedRoles.map(id => `✅ <@&${id}>`).join('\n') + '\n';
                }
                if (removedRoles.length > 0) {
                    description += removedRoles.map(id => `:ballot_box_with_check: <@&${id}>`).join('\n') + '\n';
                }

                let actionEmbed = new MessageEmbed()
                    .setDescription(description)
                    .setColor(Color);

                 btnInteraction.followUp({ embeds: [actionEmbed] , ephemeral:true});
                await m.delete();
                panelMessage.edit({ embeds: [await updateEmbedFunc(collectionName, collection, Color)] });
                removeCollector.stop();
            });
        }
        

        if (btnInteraction.customId === 'on_off') {
            collection.enabled = !collection.enabled;
            db.set(`collection_${collectionName}`, collection);
            btnInteraction.reply(`المجموعة الآن ${collection.enabled ? 'مفعلة' : 'معطلة'}.`);
            await panelMessage.edit({ embeds: [await updateEmbedFunc(collectionName, collection, Color)] });
        }

        if (btnInteraction.customId === 'remove_collection') {
            db.delete(`collection_${collectionName}`);
            btnInteraction.reply(`تمت إزالة المجموعة ${collectionName}.`);
            panelMessage.delete();
            return;
        }
    });
}

async function updateEmbedFunc(collectionName, collection, Color) {
    const updatedEmbed = new MessageEmbed()
        .setTitle(`المجموعة: ${collectionName}`)
        .addFields(
            { name: 'الأعضاء المسموح بهم', value: collection.allowedUsers.length ? collection.allowedUsers.map(id => `<@${id}>`).join('\n') : 'لا يوجد', inline: true },
            { name: 'الرولات المسموح بها', value: collection.allowedRoles.length ? collection.allowedRoles.map(id => `<@&${id}>`).join('\n') : 'لا يوجد', inline: true },
            { name: 'الرولات الممنوعة', value: collection.rolesToRemove.length ? collection.rolesToRemove.map(id => `<@&${id}>`).join('\n') : 'لا يوجد', inline: true },
            { name: 'قابل للإزالة', value: collection.enabled ? 'مفعل' : 'معطل', inline: true }
        )
        .setColor(Color);

    return updatedEmbed;
}