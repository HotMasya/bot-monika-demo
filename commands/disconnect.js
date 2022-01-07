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
    if(!voiceConnection)
        return message.channel.send(
            new Discord.RichEmbed()
            .setTitle("Не получилось " + tools.GetEmoji(bot, "snapped_natsuki"))
            .setDescription("**Я** не нахожусь ни в каком голосовом канале этого сервера!")
            .setColor(config.colors.red)
        ); 

    if(voiceConnection && message.member.voiceChannelID !== voiceConnection.channel.id)
        return message.channel.send(
            new Discord.RichEmbed()
            .setTitle("Не получилось " + tools.GetEmoji(bot, "snapped_natsuki"))
            .setDescription("**Я** уже нахожусь в другом голосовом канале!")
            .setColor(config.colors.red)
        ); 

    voiceConnection.channel.leave();
    return message.channel.send(
        new Discord.RichEmbed()
            .setTitle("Успех "+ tools.GetEmoji(bot, "yes_sayori"))
            .setDescription(`Я покинула голосовой канал **\`${voiceConnection.channel.name}\`**.`)
            .setColor(config.colors.blue)
    )
}


module.exports.data = {
    name: "disconnect",
    aliases: ["dis", "disconnect", "leave", "die"],
    descriprion: "Отключает бота от голосового канала."
}