const Discord = require("discord.js"),
  Config = require("./config.json"),
  clc = require("cli-color"),
  { ErelaClient } = require("erela.js"),
  tools = require("./tools/tools"),
  fs = require("fs"),
  Database = require("better-sqlite3");

//  Actually the discord bot client
const bot = new Discord.Client();
//  Command handler
const commandHandler = new tools.CommandHandler(bot, "..\\commands");
//  Logs handler
bot.logs = new tools.Logs("..\\logs");
//  Creating sqlite3 database
const db = new Database("server_settings.sqlite");

bot.once("ready", () => {
  //  Creating proper table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS settings
        (
            ID              INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            guildId         TEXT NOT NULL,
            prefix          TEXT NOT NULL CONSTRAINT DF_settings_prefix DEFAULT '/'  CONSTRAINT CK_settings_prefix CHECK(length(prefix) <= 5),
            djRole          TEXT NOT NULL CONSTRAINT DF_settings_djRole DEFAULT 'No DJ role set',
            djEnabled       INTEGER NOT NULL CONSTRAINT DF_settings_djEnabled DEFAULT 0,
            defaultChannel  TEXT NOT NULL CONSTRAINT DF_settings_defaultChannel DEFAULT 'No default channel set',
            defaultVolume   REAL NOT NULL CONSTRAINT DF_settings_defaultVolume DEFAULT 1,
            maxQueueLength  INTEGER NOT NULL CONSTRAINT DF_settings_maxQueueLength DEFAULT -1
        )`
  ).run();

  //  Setting up the music data and player
  bot.music = new ErelaClient(bot, Config.nodes)
    .on("nodeError", (node, error) => {
      bot.logs.Log(error.message, "ERELA_CLIENT", "error");
    })
    .on("nodeConnect", node => {
      bot.logs.Log(
        `Connected to node ${node.erela.userId}.`,
        "ERELA_CLIENT",
        "message"
      );
    })
    .on("queueEnd", player => {
      bot.logs.Log(
        `Player(${player.guild.id}) finished its queue.`,
        "ERELA_CLIENT",
        "message"
      );
      return bot.music.players.destroy(player.guild.id);
    })
    .on("trackStart", ({ textChannel }, track) => {
      bot.logs.Log(
        `${track.title}(${tools.FormatTime(
          track.duration
        )}) started playing. Requester: ${track.requester.username}.`,
        "ERELA_CLIENT",
        "message"
      );
      track.startedOn = new Date().getTime();
    });

  bot.logs.Log(
    `${bot.user.username} is working with ${bot.guilds.size} guilds.`,
    "READY_STATE",
    "message"
  );
  bot.logs.Log(`Using SQLite3 database ${db.name}.`, "READY_STATE", "message");
});

//  Adding personal server settings
bot.on("guildCreate", guild => {
  bot.logs.Log(
    `${bot.user.username} joined new guild ${guild.name}.`,
    "GUILD_CREATE",
    "message"
  );
  db.prepare(`INSERT INTO settings(guildId) VALUES (@guildId)`).run({
    guildId: guild.id
  });
});

//  Removing personal server settings
bot.on("guildDelete", guild => {
  bot.logs.Log(
    `${bot.user.username} has left guild ${guild.name}.`,
    "GUILD_DELETE",
    "message"
  );
  db.prepare(`DELETE FROM settings WHERE guildId = @guildId`).run({
    guildId: guild.id
  });
});

bot.on("message", message => {
  //  Getting custom/default server prefix
  let result = db
    .prepare(`SELECT prefix FROM settings WHERE guildId = @guildId`)
    .bind({ guildId: message.guild.id });
  let prefix = result.get().prefix;

  if (
    message.author.bot ||
    !message.content.startsWith(prefix) ||
    message.channel.type !== "text"
  )
    return;

  //  Command handler
  let args = message.content.slice(prefix.length).split(/\s/g);
  let command = args.shift().toLowerCase();

  let data = {
    prefix: prefix
  };
  commandHandler.Handle(command, message, args, db, data);
});

bot.login(Config.token);
