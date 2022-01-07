const Discord = require("discord.js"),
        tools = require("../tools/tools"),
        config = require("../config.json");

module.exports.run = async (bot, message, args) => {
    if(!message.member.voiceChannelID)
        return message.channel.send(
            new Discord.RichEmbed()
            .setTitle("Не получилось " + tools.GetEmoji(bot, "snapped_natsuki"))
            .setDescription("**Сначала** зайди в голосовой канал!")
            .setColor(config.colors.red)
        );

    let { voiceConnection } = bot.guilds.get(message.guild.id)
    if(voiceConnection && message.member.voiceChannelID !== voiceConnection.channel.id)
        return message.channel.send(
            new Discord.RichEmbed()
            .setTitle("Не получилось " + tools.GetEmoji(bot, "snapped_natsuki"))
            .setDescription("**Я** уже нахожусь в другом голосовом канале!")
            .setColor(config.colors.red)
        ); 
    else if(voiceConnection && message.member.voiceChannelID === voiceConnection.channel.id)
        return message.channel.send(
            new Discord.RichEmbed()
            .setTitle("Не получилось " + tools.GetEmoji(bot, "snapped_natsuki"))
            .setDescription("**Я** и так нахожусь в твоём голосовом канале!")
            .setColor(config.colors.red)
        );   

    message.member.voiceChannel.join();
    return message.channel.send(
        new Discord.RichEmbed()
            .setTitle("Успех "+ tools.GetEmoji(bot, "yes_sayori"))
            .setDescription(`Я подключилась к голосовому каналу **\`${message.member.voiceChannel.name}\`**.`)
            .setColor(config.colors.blue)
    )
}


module.exports.data = {
    name: "join",
    aliases: ["j", "join", "spawn", "summon"],
    descriprion: "Призывает бота в голосовой канал."
}