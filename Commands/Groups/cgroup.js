const { MessageEmbed } = require("discord.js");
const Data = require("pro.db");

module.exports = {
    name: "cgroup",
    description: "Create a new group (category) with specified text and voice channels and assign an owner.",
    usage: ["cgroup"],

    run: async (client, message, args) => {
        // Check if the bot is mentioned
        if (message.mentions.has(client.user)) {
            return message.reply("لا تمنشن بوت."); // Responds with "Do not mention the bot."
        }

        // التأكد من أن المستخدم لديه الأذونات المناسبة
        const ownerKey = `group_owner_${message.guild.id}`;
        let ownerId;

        try {
            ownerId = await Data.get(ownerKey);
        } catch (dbError) {
            console.error(`حدث خطأ أثناء جلب ID الأونر: ${dbError.message}`);
            return message.reply("حدث خطأ أثناء جلب ID الأونر من قاعدة البيانات. يرجى المحاولة مرة أخرى.");
        }

        if (!message.member.permissions.has('MANAGE_CHANNELS') && message.author.id !== ownerId) {
            return message.reply("ليس لديك إذن لإدارة القنوات.");
        }

        // الأسئلة السلسة
        const filter = (response) => response.author.id === message.author.id;
        
        const collector = message.channel.createMessageCollector({ filter, max: 5, time: 60000 });
        let ownerMention, groupName, textChannelName, voiceChannelName, groupRoleName;

        message.channel.send("يرجى ذكر الأونر (مالك القروب).");

        collector.on('collect', async (response) => {
            if (response.mentions.has(client.user)) {
                return message.reply("لا تمنشن بوت، يرجى ذكر مالك القروب مباشرة."); // If bot is mentioned
            }

            if (!ownerMention) {
                ownerMention = response.mentions.members.first();
                if (!ownerMention) {
                    return message.channel.send("يرجى ذكر مستخدم صالح لمنحه ملكية القروب (يجب ذكره).");
                }
                message.channel.send("يرجى إدخال اسم القروب.");
            } else if (!groupName) {
                groupName = validateInput(response.content, 'اسم القروب');
                if (!groupName) return message.channel.send("يرجى إدخال اسم قروب صالح.");
                message.channel.send("يرجى إدخال اسم الشات.");
            } else if (!textChannelName) {
                textChannelName = validateInput(response.content, 'اسم الشات');
                if (!textChannelName) return message.channel.send("يرجى إدخال اسم شات صالح.");
                message.channel.send("يرجى إدخال اسم القناة الصوتية.");
            } else if (!voiceChannelName) {
                voiceChannelName = validateInput(response.content, 'اسم القناة الصوتية');
                if (!voiceChannelName) return message.channel.send("يرجى إدخال اسم قناة صوتية صالح.");
                message.channel.send("يرجى إدخال اسم الدور.");
            } else if (!groupRoleName) {
                groupRoleName = validateInput(response.content, 'اسم الدور');
                if (!groupRoleName) return message.channel.send("يرجى إدخال اسم دور صالح.");
                collector.stop(); // التوقف بعد استلام جميع المدخلات
            }
        });

        collector.on('end', async () => {
            if (!ownerMention || !groupName || !textChannelName || !voiceChannelName || !groupRoleName) {
                return message.channel.send("عذرًا، لم يتم إدخال جميع المعلومات المطلوبة. يرجى المحاولة مرة أخرى.");
            }

            // تحقق مما إذا كانت المجموعة موجودة بالفعل
            const existingGroup = await Data.get(`group_${groupName}_${message.guild.id}`);
            if (existingGroup) {
                return message.reply("يوجد قروب بهذا الاسم بالفعل. يرجى اختيار اسم مختلف.");
            }

            try {
                const newCategory = await message.guild.channels.create(groupName, { type: 'GUILD_CATEGORY' });
                const textChannel = await message.guild.channels.create(textChannelName, {
                    type: 'GUILD_TEXT',
                    parent: newCategory.id
                });
                const voiceChannel = await message.guild.channels.create(voiceChannelName, {
                    type: 'GUILD_VOICE',
                    parent: newCategory.id
                });

                const groupRole = await message.guild.roles.create({
                    name: groupRoleName,
                    color: 'BLUE',
                    permissions: [
                        'VIEW_CHANNEL',
                        'SEND_MESSAGES',
                        'CONNECT',
                        'SPEAK',
                    ]
                });

                await setChannelPermissions(newCategory, groupRole, message.guild);
                await setChannelPermissions(textChannel, groupRole, message.guild);
                await setChannelPermissions(voiceChannel, groupRole, message.guild);

                await ownerMention.roles.add(groupRole);

                // Store admin ID (as the author of this command)
                const adminId = message.author.id;

                const groupInfo = {
                    name: groupName,
                    ownerId: ownerMention.id,
                    adminId: adminId,
                    groupRoleName: groupRole.name,
                    textChannelId: textChannel.id,
                    voiceChannelId: voiceChannel.id,
                };

                // Save the group data to the database
                await Data.set(`group_${groupName}_${message.guild.id}`, groupInfo);

                const embed = new MessageEmbed()
                    .setColor("GREEN")
                    .setDescription(`تم إنشاء القروب **${groupName}** بنجاح مع القنوات **${textChannel.name}** (شات) و **${voiceChannel.name}** (صوت). الدور **${groupRole.name}** قد تم منحه لـ <@${ownerMention.id}>.\n\n**مهم:** مالك القروب هو <@${ownerMention.id}>. المشرف الذي أنشأ هذا القروب هو <@${adminId}>.`);

                message.channel.send({ embeds: [embed] });

                // إرسال رسالة خاصة إلى المالك كـ embed
                const ownerEmbed = new MessageEmbed()
                    .setColor("BLUE")
                    .setTitle("تهانينا!")
                    .setDescription(`لقد تم تعيينك مالكًا للمجموعة **${groupName}**.\nيمكنك الآن إدارة القنوات والدور المخصص.\nفي حال كانت لديك أي استفسارات، لا تتردد في التواصل!`);

                try {
                    await ownerMention.send({ embeds: [ownerEmbed] });
                } catch (dmError) {
                    console.error(`فشل في إرسال رسالة خاصة للأونر: ${dmError.message}`);
                }
            } catch (error) {
                console.error(`فشل في إنشاء الفئة أو القنوات أو الدور: ${error.message}`);
                message.reply("حدث خطأ أثناء إنشاء القروب أو القنوات أو الدور. يرجى المحاولة مرة أخرى.");
            }
        });
    },
};

// Helper function to set permissions
async function setChannelPermissions(channel, groupRole, guild) {
    await channel.permissionOverwrites.set([
        {
            id: groupRole.id,
            allow: ['VIEW_CHANNEL'], // Allow the group role to view
        },
        {
            id: guild.id,
            deny: ['VIEW_CHANNEL'],  // Deny everyone else
        },
    ]);
}

// Helper function to validate input
function validateInput(input, type) {
    const validInputPattern = /^[\w\s-]+$/; // Allowed characters (letters, numbers, spaces, underscores, dashes)
    if (!validInputPattern.test(input)) {
        console.warn(`مدخل غير صالح لنوع "${type}": ${input}`);
        return null; // Invalid input
    }
    return input; // Valid input
}