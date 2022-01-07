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
            .setDescription("**Я** и так ничего не проигрываю!")
            .setFooter("Чтобы добавить трек, введите команду \"/play\".")
            .setColor(config.colors.red)
        ); 
    if(!player.skipVoting) player.skipVoting = [];

    if(player.skipVoting.length >= Math.round(message.member.voiceChannel.members.size/2) ||
        player.queue[0].requester.id === message.author.id)
        {
            let skippedTrack = player.queue[0];
            player.stop();
            message.channel.send(
                new Discord.RichEmbed()
                .setDescription(`Пропущен трек **${skippedTrack.title}**`)
                .setColor(config.colors.dark_purple)
            )
        }
    else if(!player.skipVoting.find(id => id === message.author.id)){
        player.skipVoting.push(message.author.id);
        message.channel.send(
            new Discord.RichEmbed()
            .setDescription(`Пропускаем трек? (${player.skipVoting.length}/${Math.round(message.member.voiceChannel.members.size/2)})`)
            .setColor(config.colors.dark_purple)
        )
    } 
    else
    {
        message.channel.send(
            new Discord.RichEmbed()
            .setDescription(`Вы уже проголосовали за пропуск этого трека!`)
            .setColor(config.colors.red)
        )
    }
}

module.exports.data = {
    name: "skip",
    aliases: ["s", "skip"],
    description: "Пропускает трек по голосованию участников текущего голосового канала."
}