const { MessageEmbed } = require('discord.js');
const Pro = require('pro.db');
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'listallow', // Command name in Arabic
    aliases: ['checkPermissions', 'تاكيد'], // Aliases for the command
    description: 'يعرض الصلاحيات المعينة للدور المحدد.', // Command description
    run: async function(client, message) {
        // Check if the user is an owner
        if (!owners.includes(message.author.id)) return message.react('❌');

        const Color = Pro.get(`Guild_Color_${message.guild.id}`) || '#f5f5ff';

        const Args = message.content.split(' ');

        if (!Args[1]) {
            const embed = new MessageEmbed()
                .setColor(Color)
                .setDescription(`**يرجى استخدام الأمر بالطريقة الصحيحة.**\n${prefix}تأكيد <@&رول>`);

            return message.reply({ embeds: [embed] });
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(Args[1]);

        if (!role) {
            const embed = new MessageEmbed()
                .setColor(Color)
                .setDescription('**يرجى ارفاق منشن صحيح للرول.**');
            return message.reply({ embeds: [embed] });
        }

        // Check for all permissions that are allowed for this role in the database
        const permissions = [
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

        // Retrieve the permissions for the specified role
        const grantedPermissions = permissions.filter(p => Pro.get(`Allow - Command ${p.value} = [ ${message.guild.id} ]`) === role.id);

        if (grantedPermissions.length === 0) {
            const embed = new MessageEmbed()
                .setColor(Color)
                .setDescription(`**لا توجد صلاحيات مُعينة لدور** ${role.name} **في الوقت الحالي.**`);
            return message.reply({ embeds: [embed] });
        }

        // Prepare the permissions embed
        const permissionsEmbed = new MessageEmbed()
            .setColor(Color)
            .setTitle(`الصلاحيات المعينة لدور ${role.name}`)
            .setDescription(grantedPermissions.map(p => `**✅ | ${p.name}**`).join('\n'))
            .setFooter(client.user.username, client.user.displayAvatarURL());

        // Send the embed with the permissions
        await message.reply({ embeds: [permissionsEmbed] });
    }
};