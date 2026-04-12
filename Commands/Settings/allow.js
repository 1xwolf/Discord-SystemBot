const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
const Pro = require('pro.db');
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'سماح', // Command name in Arabic
    aliases: ['allow'], // Aliases for the command
    description: 'يمكن هذا الأمر للمالكين فقط، ويسمح بإضافة صلاحيات لدور أو عضو محدد.', // Command description
    run: async function(client, message) {
        // Check if the user is an owner
        if (!owners.includes(message.author.id)) {
            return message.react('❌');
        }

        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; // Command is disabled
        }

        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        const Args = message.content.split(' ');

        if (!Args[1]) {
            return sendReply(message, Color, `**يرجى استخدام الأمر بالطريقة الصحيحة.**\n${prefix}سماح <@member or @role>`);
        }

        const Roles = message.mentions.roles.first() || message.guild.roles.cache.get(Args[1]);
        const Member = message.mentions.members.first() || message.guild.members.cache.get(Args[1]);

        if (!Roles && !Member) {
            return sendReply(message, Color, '**يرجى ارفاق منشن صحيح للرول أو العضو.**');
        }

        const permissions = definePermissions();
        const menuMessage = await createSelectionMenu(message, Color, permissions);

        const collector = createCollector(menuMessage, message.author.id, async (interaction) => {
            const chosenPermissions = interaction.values;
            const targetId = Roles ? Roles.id : Member.id;

            await grantPermissions(chosenPermissions, targetId, permissions, Color, menuMessage);
            await interaction.reply({ content: 'صلاحيات تم إضافته!', ephemeral: true });
        });

        // Handle cancel button interaction
        handleCancelButton(collector, message.author.id);
    }
};

// Helper Functions
function sendReply(message, color, description) {
    const embed = new MessageEmbed()
        .setColor(color)
        .setDescription(description);
    return message.reply({ embeds: [embed] });
}

function definePermissions() {
    return [
        { name: 'حظر وفك', value: 'ban', emoji: '📋' },
        { name: 'الطرد', value: 'kick', emoji: '📋' },
        { name: 'السجن', value: 'prison', emoji: '📋' },
        { name: 'الأسكاتي الكتابي', value: 'mute', emoji: '📋' },
        { name: 'الميوت الصوتي', value: 'vmute', emoji: '📋' },
        { name: 'اعطاء إزالة رول', value: 'role', emoji: '📋' },
        { name: 'اعطاء إزالة إنشاء, رول للجميع', value: 'allrole', emoji: '📋' },
        { name: 'الرولات الخاصة', value: 'srole', emoji: '📋' },
        { name: 'المسح', value: 'clear', emoji: '📋' },
        { name: 'الصور ،الهير ،الكام', value: 'pic', emoji: '📋' },
        { name: 'سحب ،ودني', value: 'move', emoji: '📋' },
        { name: 'قفل فتح', value: 'lock', emoji: '📋' },
        { name: 'اخفاء اظهار', value: 'hide', emoji: '📋' },
        { name: 'معلومات الرول', value: 'check', emoji: '📋' },
        { name: 'اوامر الانذارات', value: 'warn', emoji: '📋' },
        { name: 'إزالة إضافة الكنية', value: 'setnick', emoji: '📋' },
    ];
}

async function createSelectionMenu(message, color, permissions) {
    const selectMenu = new MessageSelectMenu()
        .setCustomId('permissionSelect')
        .setPlaceholder('يرجى أختيار الصلاحيات المُراد إضافتها')
        .setMinValues(1)
        .setMaxValues(permissions.length)
        .addOptions(permissions.map(permission => ({
            label: permission.name,
            value: permission.value,
            emoji: permission.emoji
        })));

    const row = new MessageActionRow().addComponents(selectMenu);
    const cancelButton = new MessageButton()
        .setCustomId('ItsCancel')
        .setLabel('إلغاء')
        .setStyle('DANGER');

    const cancelRow = new MessageActionRow().addComponents(cancelButton);
    const embed = new MessageEmbed()
        .setColor(color)
        .setTitle("يرجى تحديد الأمر.")
        .setFooter(message.client.user.username, message.client.user.displayAvatarURL());

    return await message.reply({
        embeds: [embed],
        components: [row, cancelRow]
    });
}

function createCollector(menuMessage, userId, onCollect) {
    const filter = interaction => interaction.user.id === userId;
    const collector = menuMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async interaction => {
        if (interaction.customId === 'permissionSelect') {
            await onCollect(interaction);
        }
    });

    collector.on('end', collected => {
        if (collected.size === 0) {
            menuMessage.edit('لم يتم اختيار الصلاحيات، حاول مرة أخرى.', { components: [] });
        }
    });

    return collector;
}

async function grantPermissions(chosenPermissions, targetId, permissions, color, menuMessage) {
    const grantedPermissions = [];
    const notGrantedPermissions = [];
    
    // Check for permissions availability
    if (chosenPermissions.length === 0 || permissions.length === 0) {
        const mention = targetId.startsWith('role') ? `<@&${targetId}>` : `<@${targetId}>`;
        const noPermissionsMessage = `**لا توجد صلاحيات متاحة لهذا الدور أو العضو.**`;
        
        const permissionsEmbed = new MessageEmbed()
            .setColor(color)
            .setFooter(menuMessage.client.user.username, menuMessage.client.user.displayAvatarURL())
            .setTitle("إستخدام غير ناجح ❌")
            .setDescription(`\`صلاحيات\` **${mention}**:\n\n${noPermissionsMessage}`);

        await menuMessage.edit({ embeds: [permissionsEmbed], components: [] });
        return; // Exit function as there are no permissions to grant
    }

    for (const permission of chosenPermissions) {
        const permissionKey = `Allow - Command ${permission} = [ ${menuMessage.guild.id} ]`;
        const existingPermission = Pro.get(permissionKey);

        if (existingPermission && existingPermission === targetId) {
            notGrantedPermissions.push(permission); // Already granted
        } else {
            Pro.set(permissionKey, targetId);
            grantedPermissions.push(permission); // Newly granted
        }
    }

    const mention = targetId.startsWith('role') ? `<@&${targetId}>` : `<@${targetId}>`;
    
    const grantedList = grantedPermissions.length > 0 
        ? grantedPermissions.map(permission => `**✅ | ${permissions.find(p => p.value === permission).name}**`).join('\n')
        : '';

    const notGrantedList = notGrantedPermissions.length > 0 
        ? notGrantedPermissions.map(permission => `**🚫 | ${permissions.find(p => p.value === permission).name}** تم منحها بالفعل.`).join('\n')
        : '';

    const permissionsEmbed = new MessageEmbed()
        .setColor(color)
        .setFooter(menuMessage.client.user.username, menuMessage.client.user.displayAvatarURL())
        .setTitle("إستخدام ناجح ✅")
        .setDescription(`\`صلاحيات\` **${mention}** \`الآن\`:\n\n${grantedList}${notGrantedPermissions.length > 0 ? `\n${notGrantedList}` : ''}`);

    await menuMessage.edit({ embeds: [permissionsEmbed], components: [] });
}

function handleCancelButton(collector, userId) {
    collector.on('collect', async interaction => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'ItsCancel') {
            collector.stop();
            await interaction.message.delete();
            await interaction.reply({ content: 'تم إلغاء العملية.', ephemeral: true });
        }
    });
}