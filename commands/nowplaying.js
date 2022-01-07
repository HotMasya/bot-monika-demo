const Discord = require("discord.js"),
        tools = require("../tools/tools"),
        config = require("../config.json");

module.exports.run = async (bot, message, args) => {
    if(!message.member.voiceChannelID)
        return message.channel.send(
            new Discord.RichEmbed()
            .setTitle("Не получилось " + tools.GetEmoji(bot, "snapped_natsuki"))
            .setDescription("**Сначала** зайдите в голосовой канал!")
            .setColor(config.colors.red)
        );

    let { voiceConnection } = bot.guilds.get(message.guild.id)
    if(voiceConnection && message.member.voiceChannelID !== voiceConnection.channel.id)
        return message.channel.send(
            new Discord.RichEmbed()
            .setTitle("Не получилось " + tools.GetEmoji(bot, "snapped_natsuki"))
            .setDescription("**Вы** должны находится в одном голосовом канале со мной!")
            .setColor(config.colors.red)
        ); 

    let player = bot.music.players.get(message.guild.id);
    if(!player)
        return message.channel.send(
            new Discord.RichEmbed()
            .setTitle("Не получилось " + tools.GetEmoji(bot, "snapped_natsuki"))
            .setDescription("**Я** ничего не проигрываю!")
            .setFooter("Чтобы добавить трек, введите команду \"/play\".")
            .setColor(config.colors.red)
        );

    let timeplayed= new Date().getTime() - player.queue[0].startedOn;
    let timeline = "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬".replaceAt(Math.round(timeplayed/player.queue[0].duration*30)-1, "🔘");
    message.channel.send(
        new Discord.RichEmbed()
        .setAuthor("Сейчас играет:", "https://i.gifer.com/78fl.gif")
        .setColor(config.colors.dark_purple)
        .setDescription(`${tools.FormatTime(timeplayed)}\`${timeline}\`${tools.FormatTime(player.queue[0].duration)}`)
        .setThumbnail(player.queue[0].thumbnail)
        .addField("Заказал", player.queue[0].requester)
    );
}

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

module.exports.data = {
    name: "nowplaying",
    aliases: ["np", "nowplaying", "nplaying"],
    description: "Показывает текущий трек, который проигрывается."
}