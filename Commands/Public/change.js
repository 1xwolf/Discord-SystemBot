const { MessageAttachment ,Discord } = require('discord.js')
const Canvas = require("canvas");
const deepai = require("deepai");
const isImageUrl = require("is-image-url");
const cloudinary = require("cloudinary").v2;
const Data = require('pro.db');

module.exports = {
    name: "change",
    description:"",
    aliases:["ch"],
    type: "image",
run: async (client, message, args) => {


  const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
  if (isEnabled === false) {
      return; 
  }


  let setchannek = Data.get(`setChannel_${message.guild.id}`);
  if (setchannek && message.channel.id !== setchannek) return;


  deepai.setApiKey("37daf812-c7fd-460c-903c-ad362b9d6b76");
  cloudinary.config({
    'cloud_name': "ertghy",
    'api_key': '256788467711845',
    'api_secret': "2IGlZ3XdRuSJ0SD53NQZntKGMNk"
  });
  let image = message.attachments.first() ? message.attachments.find(_0x1c5be8 => ["jpg", "jpeg", 'png', "gif"].find(_0x3538b1 => _0x1c5be8.proxyURL.includes(_0x3538b1))).proxyURL : undefined || args[0x0] ? isImageUrl(args[0x0]) ? args[0x0] : undefined : undefined || message.author.displayAvatarURL({
    'format': 'png',
    'size': 0x800,
    'dynamic': true
  });
  if (message.mentions.users.first()) {
    image = message.mentions.users.first().displayAvatarURL({
      'format': 'png',
      'dynamic': true,
      'size': 0x800
    });
  }
  cloudinary.uploader.upload(image, {
    'public_id': message.author.id,
    'transformation': [{
      'effect': "grayscale"
    }]
  }, (_0x485e3a, _0x52775a) => {
    if (_0x485e3a) {
      return message.channel.send("Error ..").then(_0x4d8964 => setTimeout(() => {
        _0x4d8964["delete"]();
        message["delete"]();
      }, 0xbb8));
    }
    message.reply({
      'content': "** **",
      'files': [{
        'attachment': _0x52775a.url
      }]
    });
  })
  }
}