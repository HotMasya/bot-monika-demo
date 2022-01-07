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

    let queueData = {
        list: "",
        offset: 10,
        page: 0
    };

    for(let i = queueData.page*queueData.offset; i < (queueData.page + 1)*queueData.offset; i++)
    {
        if(i !== 0){
            if(i < player.queue.length)
                queueData.list+= `[${i+1}. ${player.queue[i].title}](${player.queue[i].uri}) (${tools.FormatTime(player.queue[i].duration)})\n`;
            else 
               queueData.list += `**${i+1}.**\n`;
        }         
    }

    message.channel.send
    (
        new Discord.RichEmbed()
        .setTitle("Сейчас играет: ")
        .setDescription(`[1. ${player.queue[0].title}](${player.queue[0].uri}) (${tools.FormatTime(player.queue[0].duration)})\n\n**На очереди(${queueData.page*queueData.offset+1}-${(queueData.page + 1)*queueData.offset}):**\n`+queueData.list+"**Общая длительность: "+tools.FormatTime(player.queue.reduce((acc, cur) => ({duration: acc.duration + cur.duration})).duration)+"**")
        .setColor(config.colors.dark_purple)
    )
    .then(async queueMsg => {
        await queueMsg.react("⬅️");
        await queueMsg.react("➡️");

        const collector = queueMsg.createReactionCollector((reaction, user) => {return (reaction.emoji.name === "➡️" || reaction.emoji.name === "⬅️") && user.id === message.author.id}, {time: 60000});
        collector.on("collect", reaction => {
            if(reaction.emoji.name === "➡️")
            {   
                if(player.queue.length <= (queueData.page + 1)*queueData.offset) return;

                queueData.page++;
                
                RenderQueueList(queueMsg);
            }
            else if (reaction.emoji.name === "⬅️")
            {
                if(queueData.page === 0) return;

                queueData.page--;

                RenderQueueList(queueMsg);
            }
        });
    })
    .catch(error => console.log(error.message));
    

    function RenderQueueList(message)
    {
        queueData.list = "";

        for(let i = queueData.page*queueData.offset; i < (queueData.page + 1)*queueData.offset; i++)
        {
            if(i !== 0){
                if(i < player.queue.length)
                    queueData.list+= `[${i+1}. ${player.queue[i].title}](${player.queue[i].uri}) (${tools.FormatTime(player.queue[i].duration)})\n`;
                else 
                   queueData.list += `**${i+1}.**\n`;
            }      
        }

        message.edit(
            new Discord.RichEmbed()
            .setTitle("Сейчас играет: ")
            .setDescription(`[1. ${player.queue[0].title}](${player.queue[0].uri}) (${tools.FormatTime(player.queue[0].duration)})\n\n**На очереди(${queueData.page*queueData.offset+1}-${(queueData.page + 1)*queueData.offset}):**\n`+queueData.list+"**Общая длительность: "+tools.FormatTime(player.queue.reduce((acc, cur) => ({duration: acc.duration + cur.duration})).duration)+"**")
            .setColor(config.colors.dark_purple)
        );
    }
}

module.exports.data = {
    name: "queue",
    aliases: ["q", "queue"],
    description: "Выводит список заказанных песен."
}