const Discord = require("discord.js");
const db = require(`pro.db`);
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'help',
    run: (client, message, args) => {
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return;
        }

        const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        const guild = message.guild;
        const currentDate = new Date();

        const replyembed = new Discord.MessageEmbed()
            .setColor(Color)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter(`${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`);

        // تحقق من وجود البادئة
        if (!prefix) {
            replyembed.setDescription(`**اوامر البوت :
                يمكنك الان عرض قائمة الاوامر المناسبة لك
                **عدد الأوامر** : 222**
**البادئة :** لا يوجد بادئة`);
        } else {
            replyembed.setDescription(`**اوامر البوت :
                يمكنك الان عرض قائمة الاوامر المناسبة لك
                **عدد الأوامر** : 222**
                **البادئة :** ${prefix}`);
        }


        const row = new Discord.MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('help')
                    .setPlaceholder("اختر من القائمة")
                    .addOptions([
                        { label: 'ألاوامر ألعامة', value: 'help1' },
                        { label: 'آوامر ا لادارة', value: 'help2' },
                        { label: 'آوامر الرولات', value: 'help3' },
                        { label: 'آوامر الشاتات', value: 'help4' },
                        { label: 'آوامر الحماية', value: 'help5' },
                        { label: 'آوامر ألاعدادات', value: 'help6' },
                        { label: 'آوامر ألتذاكر', value: 'help7' },
                        { label: 'آوامر القروبات', value: 'help11' },
                        { label: 'آوامر الرومات الصوتية', value: 'help12' },
                        { label: 'آوامر مالك البوت', value: 'help9' },
                        { label: 'حذف القائمة', value: 'help10' },
                    ]),
            );

        message.reply({
            embeds: [replyembed],
            components: [row]
        }).catch(console.error).then(message => setTimeout(() => {
            const row = new Discord.MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('help')
                        .setPlaceholder("آختار من القائمة ما يناسبك بالاسفل")
                        .setDisabled(true)
                        .addOptions([
                            { label: 'آلاوامر ألعامة', value: 'help1' },
                            { label: 'آوامر ا لادارة', value: 'help2' },
                            { label: 'آوامر الشاتات', value: 'help4' },
                            { label: 'آوامر الرولات', value: 'help3' },
                            { label: 'آوامر الحماية', value: 'help5' },
                            { label: 'آوامر ألاعدادات', value: 'help6' },
                            { label: 'آوامر ألتذاكر', value: 'help7' },
                            { label: 'آوامر السيرفر.', value: 'help9' },
                            { label: 'آوامر القروبات', value: 'help11' },
                            { label: 'آوامر الرومات الصوتية', value: 'help12' },
                            { label: 'حذف قائمة المساعدة', value: 'help10' },
                        ]),
                );
            message.edit({ embeds: [replyembed], components: [row] });
        }, 2000000)).catch(console.error);

        client.on("interactionCreate", interaction => {
            if (!interaction.isSelectMenu()) return;
            if (interaction.user.id !== message.author.id) return;

            let replyembed;
            if (interaction.values == "help1") {
                replyembed = new Discord.MessageEmbed()
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setTitle('ألاوامر ألعامة')
                    .setDescription(`
**${prefix}help** : **قائمه المساعدة**
**${prefix}avatar** : **عرض صورة شخص**
**${prefix}banner** : **عرض بنر شخص**
**${prefix}user** : **عرض معلومات عضو**
**${prefix}top** : **عرض توب 8 اشخاص**
**${prefix}profile** : **عرض بروفيال العضو**
**${prefix}id** : **عرض لفلك او لفل شخص معين**
**${prefix}server** : **عرض معلومات السيرفر**
**${prefix}myinv** : **عدد دعواتك**
**${prefix}topinv** : **اعلى عدد دعوات**
**${prefix}mcolors** : **اختار لونك من القائمة**
**${prefix}colors** : **علبة الالوان**
**${prefix}color** : **اختيار لون**
**${prefix}change** : **اضافة فلتر لصورة**
**${prefix}circle** : **عرض صورة العضو على شكل دائرة**
**${prefix}aremove** : **يزيل خلفية الصور**
**${prefix}semoji** : **أرسال صورة الايموجي**
**${prefix}edit-image** : **فلاتر وتعديل علي الصور**
                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help2") {
                replyembed = new Discord.MessageEmbed()
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setTitle('ألاوامر ألإدارية')
                    .setDescription(`
**${prefix}stickers** : **اضافة ستيكرز للسيرفر**
**${prefix}aemoji** : **اضافة ايموجي للسيرفر**
**${prefix}kickofflinebots** : **طرد البوتات غير متصلة**
**${prefix}blockpic** : **بلوك صور**
**${prefix}blocked** : **عرض الاعضاء من عليهم بلوك صور**
**${prefix}removeblockpic** : **ازالة بلوك الصورمن شخص معين**
**${prefix}mute** : **اسكات كتابي**
**${prefix}mymute** : **معلومات ميوت العضو**
**${prefix}unmute** : **الغاء الاسكات الكتابي**
**${prefix}prison** : **سجن عضو**
**${prefix}myprison** : **معلومات سجن العضو**
**${prefix}unprison** : **فك سجن عضو**
**${prefix}unvmute** : **فك ميوت صوتي عن عضو**
**${prefix}rooms ** : **اظهار الادمن الخارجين من الرومات الصوتيه**
**${prefix}adminlist ** : **اظهار جميع الادمن بالسيرفر**
**${prefix}vkick** : **طرد عضو من الروم الصوتي**
**${prefix}vmute** : **اسكات عضو من الفويس**
**${prefix}infractions** : **اظهار عقوبات العضو**
**${prefix}ban** : **حظر العضو**
**${prefix}unban** : **الغاء الحظر من شخص**
**${prefix}unbanal** : **الغاء المحظورين من السيرفر**
**${prefix}allbans** : **قائمة المحظورين**
**${prefix}lastvoice** : **معرفة اخر دخول رومات صوتية**
**${prefix}kick** : **طرد عضو من السيرفر**
**${prefix}setnick** : **تغيير اسم عضو داخل السيرفر**
**${prefix}clear** : **مسح رسائل الشات**
**${prefix}records** : **سجل عقوبات العضو**
**${prefix}move** : **سحب عضو الى روم اخر**
**${prefix}moveme** : **توديك لعضو بروم اخر**
**${prefix}warn** : **اعطاء تحذير لعضو**
**${prefix}warnings** : **الحصول على قائمة التحذيرات لعضو**
**${prefix}remove-warn** : **إزالة تحذير اعضاء**
**${prefix}blacklist** : **اعطاء بلاكلست لعضو**
**${prefix}setupblchat ** : **تحديد شات البلاكلست**
**${prefix}unblacklist** : **إزلة  البلاكلست من عضو**
**${prefix}timeout** : **اعطاء تايم اوت**
**${prefix}untimeout** : **ازلة التايم اوت**
**${prefix}stats** : **اظهار معلومات الاداري**
                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help3") {
                replyembed = new Discord.MessageEmbed()
                    .setTitle('آوامر ألرولات')
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setDescription(`
**${prefix}setreactionrole** : **رياكدشن رول**
**${prefix}rereactrole** : **إزلة رياكدشن رول**
**${prefix}role** : **اضافة رتبة لعضو**
**${prefix}myrole** : **تعديل رولك الخاص**
**${prefix}dsrole** : **حذف رول خاص**
**${prefix}srole** : **انشاء رول خاص**
**${prefix}addrole** : **انشاء رول جديد**
**${prefix}autorole** : **اضافة رتبة لكل عضو يدخل**
**${prefix}daorole** : **حذف تحديد الرول التلقائي**
**${prefix}allrole** : **اعطاء رول لجميع الاعضاء**
**${prefix}r all -rolename** : **ازاله رول من جميع الاعضاء**
**${prefix}here** : **اضافة رول الهير للعضو**
**${prefix}pic** : **اضافة رول الصور للعضو**
**${prefix}editrole** : **تعديل اسم الرول**
**${prefix}live** : **اضافة رتبة تسمح بفتح كام وشير**
**${prefix}nick** : **اضافة رتبه تغير الاسم**
**${prefix}check** : **تشييك على الاعضاء في الرول**
**${prefix}checkvc** : **تشييك علي الاعضاء في الرول المتصلين بالرومات الصوتية**
                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help4") {
                replyembed = new Discord.MessageEmbed()
                    .setTitle('آوامر الشاتات')
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setDescription(`
**${prefix}ochat** : **تحديد شات الاوامر**
**${prefix}feel** : **اعداد شات الفيلنج**
**${prefix}hide** : **إحفاء الشات عن الكل**
**${prefix}unhide** : **إظهار الشات للكل**
**${prefix}unhideall** : **إظهار  كل الرومات**
**${prefix}hideall** : **اخفاء كل الرومات**
**${prefix}lock** : **قفل الروم**
**${prefix}unlock** : **فتح الروم**
**${prefix}slowmode** : **تفعيل الوضع البطيء بالروم**
**${prefix}autoreply** : **اضافة كلمة وردها**
**${prefix}dreply** : **حذف كلمة وردها**
**${prefix}mhide** : **إخفاء الشات عن عضو**
**${prefix}mshow** : **إظهار الشات لعضو**
**${prefix}autoline** : **فاصل تلقائي بالشات**
**${prefix}unline** : **تعطيل الفاصل التلقائي بالشات**
**${prefix}setreact** : **رياكدشن تلقائي بالشات**
**${prefix}unreact** : **تعطيل الرياكشن التلقائي بالشات**
**${prefix}applay** : **تفعيل المنشن والصور بالشات**
**${prefix}disapplay** : **تعطيل المنشن والصور بالشات**
**${prefix}setpic** : **شات الصور**
**${prefix}embed** : **تكتب رساله وتكون على شكل امبيد**
**${prefix}unpic** : **تعطيل شات الصور**
**${prefix}rate** : **تقييم تلقائي** 
**${prefix}feedrate** : *تحديد شات التقييم التلقائي** 
**${prefix}setrchat** : **تعيين شات التقييمات**
**${prefix}dltrchat** : **حذف شات التقييمات**
**${prefix}setrimage** : **تعيين صورة التقييمات**
**${prefix}setrcolor** : **تعيين لون صورة خط التقييمات**
                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help5") {
                replyembed = new Discord.MessageEmbed()
                    .setTitle("آوامر الحماية :")
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setDescription(`
**${prefix}advice** : **نصائح يمكن تفيدك**
**${prefix}sechard** : **تفعيل والغاء الحماية القصوى**
**${prefix}setlimit** : **تحديد الحد للحمايه**
**${prefix}maxsec** : **تفعيل الحمايه المتقدمة**
**${prefix}sloprot** : **تحديد لوق الحمايه المتقدمه**
**${prefix}aprot** : **إضافة أشخاص لتخطى الحماية المتقدمه**
**${prefix}dprot** : **ازاله أشخاص لتخطى الحماية المتقدمه**
**${prefix}status** : **حالة الحماية**
**${prefix}bots** : **اظهار البوتات الموجودة بالسيرفر**
**${prefix}word** : **اضافة او ازالة كلمات يعاقب كاتبها**
**${prefix}wordlist** : **عرض الكلامات التي يعاقب كاتبها**
**${prefix}pslist** : **عرض قائمة الحماية المفعلة والمعطلة**
**${prefix}restbackup** : **إسترجاع السيرفر**
**${prefix}restemoji** : **إسترجاع الاموجيات الخاصة بسيرفرك**
**${prefix}block** : **منع عضو من دخول السيرفر**
**${prefix}unblock** : **فك منع عضو من دخول السيرفر**
**${prefix}setsecurity** : **إنشاء لوجات الحماية**
**${prefix}wanti** : **إضافة أشخاص لتخطى الحماية**
**${prefix}wantilist** : **عرض قائمة الاشخاص المسوح لهم**
**${prefix}servername** : **تفعيل والغاء الحماية من تغيير اسم السيرفر**
**${prefix}serveravatar** : **تفعيل والغاء الحماية من تغيير صورة السيرفر**
**${prefix}setrjoin** : **تحديد الاجراء مع الحسابات الجديده**
**${prefix}antijoin** : **تفعيل والغاء  تبنيد او سجن الحسابات الجديدة**
**${prefix}antibots** : **تفعيل والغاء الحماية من البوتات**
**${prefix}antilink** : **تفعيل والغاء الحماية من الروابط**
**${prefix}antidelete** : **تفعيل والغاء حماية حذف الشاتات و الرولات**
**${prefix}anticreate** : **تفعيل والغاء حماية من إنشاء الشاتات و الرولات**
**${prefix}antispam** : **تفعيل والغاء الحماية من الاسبام**
**${prefix}antiwebhook** : **تفعيل والغاء الحماية من انشاء ويب هوك**
**${prefix}antiperms** : **تفعيل والغاء الحماية من تغيير برمشن الرولات**
**${prefix}cols** : **تعديل حمايه الرولات**
                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help6") {
                replyembed = new Discord.MessageEmbed()
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setTitle('آوامر ألاعدادات')
                    .setDescription(`
**${prefix}allow** : **السماح لعضو او رول لاستعمال امر**
**${prefix}deny** : **منع لعضو او رول لاستعمال امر**
**${prefix}listallow** : **قائمة السماح منشن الرول او الشخص وشوف صلاحياته**
**${prefix}permission** : **رؤية البرمشنات المفعلة فقط في الرول**
**${prefix}settings ** : **تعديل اعدادات السيرفر**
**${prefix}setlog** : **انشاء شاتات اللوق**
**${prefix}detlog** : **حذف شاتات اللوق**
**${prefix}setbanlimit** : **وضع حد للباند عن طريق بوت** 
**${prefix}chanpro** : **تحديد خلفية امر بروفايل**
**${prefix}imagechat** : **تحديد صورة لعلبة الالوان**
**${prefix}ctcolors** : **انشاء رولات الوان**
**${prefix}setclear** : **إلغاء / تحديد شات المسج التلقائي**
**${prefix}edit-wlc** : **تعديل اعدادات الترحيب**
**${prefix}edit-avt** : **جميع اوامر تعديل سيرفرات الافتارت**
**${prefix}clearcat** : **تعين المسح التلقائي للرومات الصوتيه**
**${prefix}rblock** : **منع عضو من رول معين**
**${prefix}runblock** : **إزلة الرول المحظور من عضو**
**${prefix}setuadmin** : **فقط من قام باعطاء العقوبه قادر على ازالتها**
**${prefix}pallow** : **يستطيع فك اي عقوبه من العقوبات**
**${prefix}plist ** : **عرض قائمة الاشخاص من يمتلكون صلاحية فك اي عقوبة من العقوبات**
**${prefix}premove** : **ازالة الشخص من فك اي عقوبه من العقوبات**
**${prefix}reasons** : **تعيين اسباب العقوبات**
**${prefix}locomnd** : **تفعيل او تعطيل امر**
**${prefix}setvoice** : **تثبيت البوت بفويس**
**${prefix}progress** : **تفعيل أو ايقاف نظام النقاط**
**${prefix}reset-all** : **تصفير جميع النقاط**
**${prefix}reset** : **تصفير نقاط عضو**
**${prefix}rlevel** : **قائمة جميع الفلات**
**${prefix}dinfractions** : **تعديل عقوبات العضو**
**${prefix}settask ** : **تحديد المهام الاداريه**
**${prefix}task** : **عرض المهام الاداريه**
**${prefix}removetask** : **إزالة مهمة إدارية**

                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help7") {
                replyembed = new Discord.MessageEmbed()
                    .setTitle('أوامر ألتذاكر')
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setDescription(`
**${prefix}tipanel** : **جميع اوامر التحكم بالتذكرة**
**${prefix}ticlog** : **تعيين شات لوج التذكرة**
**${prefix}tcsend** : **ارسال رسالة عند فتح التذكرة**
**${prefix}tcopen** : **تعيين الكاتاقوري**
**${prefix}setticket** : **عداد رسالة التذكرة**
**${prefix}tcrole** : **اضافة رولات التذكرة**
**${prefix}tcrestart** : **اعادة تعيين التذاكر**
**${prefix}ticimage** : **تعيين صورة التذكرة**
**${prefix}rename** : **تعيين إسم جديد لتذكرة**
**${prefix}close** : **إغلاق التذكرة المفتوحة**
                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help9") {
                replyembed = new Discord.MessageEmbed()
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setTitle('آوامر السيرفر :')
                    .setDescription(`
**${prefix}vip** : **أوامر ألاونر**
**${prefix}guild** : **نقل البوت من سيرفر الي سيرفر**
**${prefix}dm** : **ارسال رساله لخاص العضو**
**${prefix}say** : **ارسال رساله عن طريق البوت**
**${prefix}setprefix** : **تغيير بادئه البوت**
**${prefix}cmunprefix** : **أستعامل جميع الاوامر بدون برفيكس**
**${prefix}owners** : **عرض قائمة الاونرات**
**${prefix}setowner** : **إضافة اونر للبوت**
**${prefix}setbanner** : **تغيير بنر البوت**
**${prefix}setavatar** : **تغيير صورة البوت**
**${prefix}rembanner** : **إزلة بنر البوت** 
**${prefix}setname** : **تغيير اسم البوت**
**${prefix}setstatus** : **تغيير حالة البوت**
**${prefix}setecolor** : **تغيير لون الامبيد**
**${prefix}removeowner** : **ازالة اونر من البوت**
**${prefix}acomnd** : **أضافه اختصار للأوامر**
**${prefix}listlcomnd** : **يظهر قائمة الاختصارات**
**${prefix}removeShortcut** : **يحذف اختصار**
**${prefix}resetbot** : **فورمات للبوت كامل**
**${prefix}uptime** : **مدة تشغيل البوت**
**${prefix}restart** : **اعادة تشغيل البوت**


                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help12") {
                replyembed = new Discord.MessageEmbed()
                    .setTitle('آوامر الرومات الصوتيه')
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setDescription(`
**${prefix}callow** : **سماح لعضو بدخول الروم الصوتي**
**${prefix}cdeny** : **منع العضو من دخول الروم الصوتي**
**${prefix}chide** : **اخفاء الروم الصوتي عن عضو معين**
**${prefix}clist** : **قائمة الاشخاص الممنوعين من دخول روم معين**
**${prefix}cunhide** : **اظهار الروم الصوتي عن عضو معين**
                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help11") {
                replyembed = new Discord.MessageEmbed()
                    .setColor(`${Color || `#f5f5ff`}`)
                    .setTitle(' آوامر القروبات :')
                    .setDescription(`
**${prefix}cgroup** : **انشاء قروب جديد**
**${prefix}delgroup** : **حذف قروب**
**${prefix}grole** : **اضافة رول القروب الى العضو**
**${prefix}panel** : **لوحة تحكم للقروبات**
**${prefix}rerole** : **ازالة رول القروب من العضو**
                    `);
                interaction.update({ embeds: [replyembed] });
            } else if (interaction.values == "help10") {
                if (interaction.user.id !== message.author.id) return;
                interaction.message.delete();
            }
        });
    }
}