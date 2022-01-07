const Discord = require("discord.js"),
        tools = require("../tools/tools"),
        config = require("../config.json");

/**
 *  Plays a soundtrack of searches
 *  for tracks or playlists
 * 
 *  @param {Discord.Client} bot Actually the bot
 *  @param {Discord.Message} message the message of the author of the command
 *  @param {Array} args arguments for this command
 */
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

    if(!args || !args.length)
        return message.channel.send(
            new Discord.RichEmbed()
            .setTitle("Использование " + tools.GetEmoji(bot, "computer_monika"))
            .setDescription("**```/playtop <ссылка/запрос>```**")
            .setColor(config.colors.blue)
        );

    let { voiceChannel } = message.member
    const player = bot.music.players.spawn({
        guild: message.guild,
        textChannel: message.channel,
        voiceChannel
    });

    bot.music.search(args.join(" "), message.author)
    .then(async result => {
        switch(result.loadType)
        {
            case "TRACK_LOADED":
                if(!player.queue || !player.queue.length) player.queue.add(result.tracks[0]);
                else
                {
                    let curTrack = player.queue.shift();
                    player.queue.unshift(result.tracks[0]);
                    player.queue.unshift(curTrack);
                }

                if(!player.playing){
                    message.channel.send(
                        new Discord.RichEmbed()
                        .setAuthor("Сейчас играет", "https://i.gifer.com/78fl.gif")
                        .setColor(config.colors.dark_purple)
                        .setThumbnail(result.tracks[0].thumbnail)
                        .setDescription(`[${result.tracks[0].title}](${result.tracks[0].uri})`)
                        .addField("Длительность", tools.FormatTime(result.tracks[0].duration), true)
                        .addField("Заказал", message.member, true)
                    )
                    player.play();
                } else message.channel.send(
                    new Discord.RichEmbed()
                        .setAuthor(message.author.username + " добавил в начало очереди:", message.author.avatarURL)
                        .setDescription(`[${result.tracks[0].title}](${result.tracks[0].uri})`)
                        .setColor(config.colors.dark_purple)
                        .setThumbnail(result.tracks[0].thumbnail)
                        .addField("Канал", result.tracks[0].author, true)
                        .addField("Длительность", tools.FormatTime(result.tracks[0].duration), true)
                        .addField("Позиция в очереди", player.queue.length, true)
                        .addField("До проигрывания осталось", tools.FormatTime(player.queue.reduce((acc, cur) => ({duration: acc.duration + cur.duration})).duration), true)
                )
            break;

            case "SEARCH_RESULT":
                let index = 1;
                const tracks = result.tracks.slice(0, 5);
                const embed = new Discord.RichEmbed()
                    .setAuthor("Выберите трек из списка", message.author.displayAvatarURL)
                    .setDescription(tracks.map(track => `**${index++}. ${track.title}**`))
                    .setColor(config.colors.blue)
                    .setFooter("Ваш заказ закроется через 30 секунд автоматически. Чтобы отменить заказ, введите в чат \"cancel\".");
                
                await message.channel.send(embed);

                const collector = message.channel.createMessageCollector(m => {
                    return m.author.id === message.author.id && new RegExp("^([1-5|cancel])$", "i").test(m.content)
                }, {time: 30000, max: 1});

                collector.on("collect", m => {
                    if(/cancel/i.test(m.content)) return collector.stop("canceled");

                    const track = tracks[Number(m.content) - 1];

                    if(!player.queue || !player.queue.length) player.queue.add(track);
                    else
                    {
                        let curTrack = player.queue.shift();
                        player.queue.unshift(track);
                        player.queue.unshift(curTrack);
                    }

                    if(!player.playing){
                        message.channel.send(
                            new Discord.RichEmbed()
                            .setAuthor("Сейчас играет", "https://i.gifer.com/78fl.gif")
                            .setColor(config.colors.dark_purple)
                            .setDescription(`[${track.title}](${track.uri})`)
                            .setThumbnail(track.thumbnail)
                            .addField("Длительность", tools.FormatTime(track.duration), true)
                            .addField("Заказал", message.member, true)
                        )
                        player.play();
                    } else message.channel.send(
                        new Discord.RichEmbed()
                            .setAuthor(message.author.username + " добавил в начало очереди:", message.author.avatarURL)
                            .setDescription(`[${track.title}](${track.uri})`)
                            .setColor(config.colors.dark_purple)
                            .setThumbnail(track.thumbnail)
                            .addField("Канал", track.author, true)
                            .addField("Длительность", tools.FormatTime(track.duration), true)
                            .addField("Позиция в очереди", player.queue.length, true)
                            .addField("До проигрывания осталось", tools.FormatTime(player.queue.reduce((acc, cur) => ({duration: acc.duration + cur.duration})).duration), true)
                    )
                });

                collector.on("end", (collection, reason) => {
                    if(["time", "canceled"].includes(reason)) return message.channel.send("Cancelled selection!");
                });
            break;

            case "PLAYLIST_LOADED":
                if(!player.queue || !player.queue.length) result.playlist.tracks.forEach(track => player.queue.unshift(track));
                else
                {
                    let curTrack = player.queue.shift();
                    result.playlist.tracks.forEach(track => player.queue.unshift(track));
                    player.queue.unshift(curTrack);
                }
                
                const duration = tools.FormatTime(result.playlist.tracks.reduce((acc, cur) => ({duration: acc.duration + cur.duration})).duration);

                message.channel.send(
                    new Discord.RichEmbed()
                    .setColor(config.colors.dark_purple)
                    .setAuthor(`${message.author.username} добавил в начало очереди плейлист: `)
                    .setDescription(`[${result.playlist.info.name}](${args.join(" ")})`)
                    .addField("Треков", result.playlist.tracks.length, true)
                    .addField("Общая длительность",duration, true)
                );

                if(!player.playing){
                    message.channel.send(
                        new Discord.RichEmbed()
                        .setAuthor("Сейчас играет", "https://i.gifer.com/78fl.gif")
                        .setColor(config.colors.dark_purple)
                        .setDescription(`[${result.playlist.tracks[0].title}](${result.playlist.tracks[0].uri})`)
                        .setThumbnail(result.playlist.tracks[0].thumbnail)
                        .addField("Длительность", tools.FormatTime(result.playlist.tracks[0].duration), true)
                        .addField("Заказал", message.author.username, true)
                    )
                    player.play();
                } 
            break;
        }
    })
    .catch(error => message.channel.send(`**ERROR:** ${error.message}`));
}

module.exports.data = {
    name: "playtop",
    aliases: ["pt", "playtop"],
    description: "Работает аналогично команде /play, только добавляет трек в начало очереди."
}