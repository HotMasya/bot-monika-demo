const db = require("better-sqlite3");

const database = new db("server_settings.sqlite");

console.log(database.prepare(`UPDATE settings SET prefix = '!' WHERE guildId = @guildId`).run({guildId: "680142571196252185"}));