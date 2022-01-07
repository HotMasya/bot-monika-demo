const Discord = require("discord.js"),
        tools = require("../tools/tools"),
        config = require("../config.json");

module.exports.run = async (bot, message, args, db, data) => {
    if(!args || !args.length)
    {
        let settings = db.prepare(`SELECT * FROM settings WHERE guildId = @guildId`).bind({guildId: message.guild.id}).get();

        message.channel.send(
            new Discord.RichEmbed()
                .setTitle(`Настройки сервера ${message.guild.name}`)
                .setColor(config.colors.blue)
                .setThumbnail(message.guild.iconURL)
                .setFooter(`${bot.user.username} bot by ${bot.users.get("324416295120404480").tag}`, bot.users.get("324416295120404480").avatarURL)
                .setDescription(`Чтобы получить больше информации о том, как настроить бота, введите \`${data.prefix}settings <параметр>\`.`)
                .addField("Префикс", `**\`${settings.prefix}\`**`, true)
                .addField("Роль DJ", `**\`${settings.djRole == 'No DJ role set' ? 'Роль не установлена' : message.guild.roles.get(settings.djRole)}\`**`, true)
                .addField("Режим DJ", `**\`${settings.djEnabled ? "Включён" : "Выключен"}\`**`, true) 
                .addField("Канал для команд", `**\`${settings.defaultChannel == "No default channel set" ? "Не установлен" : message.guild.channels.filter(c => c.type == "text").get(settings.defaultChannel)}\`**`, true)
                .addField("Звук по-умолчанию", `**\`${settings.defaultVolume*100}%\`**`, true)
                .addField("Макс. размер очереди", `**\`${settings.maxQueueLength === -1 ? "Не установлен" : settings.maxQueueLength}\`**`, true)
        )
    }
}