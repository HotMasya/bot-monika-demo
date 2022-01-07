const Discord = require("discord.js");
const Config = require("../config.json");
const cli = require("cli-color");
const fs =require("fs");
const Database = require("better-sqlite3");

/**
 *  Will format the time from mileseconds
 *  to string like hh:mm:ss
 *  
 *  @param {Number} mileseconds The mileseconds to format
 *  @return {String} The string in format of hh:mm:ss
 */
module.exports.FormatTime = function(mileseconds)
{
    let hours = 0, mins = 0, secs = 0;

    while(mileseconds >= 1000)
    {
        secs++;
        if(secs === 60)
        {
            secs = 0;
            mins++;
        }

        if(mins === 60)
        {
            mins = 0;
            hours++
        }

        mileseconds -= 1000;
    }

    return `${hours ? (hours < 10 ? `0${hours}:` : hours + ":") : ""}${mins ? (mins < 10 ? `0${mins}:` : mins + ":") : "00:"}${secs ? (secs < 10 ? "0"+secs : secs) : "00"}`;
}

/**
 *  Will return the custom emoji from
 *  Deeprism discord server
 *  
 *  @param {Discord.Client} bot Actually the bot
 *  @param {String} emojiName the name of the emoji
 *  @returns {Discord.Emoji} the custom emoji object
 */
module.exports.GetEmoji = function(bot, emojiName)
{
    return bot.guilds.get(Config.guildID).emojis.find(e => e.name === emojiName);
}

/**
 *  Represents bot logging class
 */
module.exports.Logs = class {
    /**
     *  @param {String} folder The path to the logs folder
     */
    constructor(folder)
    {
        try{
            if(fs.existsSync(__dirname + "\\" + folder)){
                this.folder = __dirname + "\\" + folder;
            }
            else{
                throw new Error(`The folder ${__dirname}\\${folder} doesn't exist!`);
            }
        }
        catch(error)
        {
            console.log(cli.redBright(error.message));
        }
    }

    /**
     * 
     *  Logs a message to the console end log file
     * 
     * @param {string} message                          The message to log
     * @param {string} source                           The source of the log
     * @param {"message" | "error" | "warning"} type    The type of this message. The color depends on it;
     * @param {Date} datetime                           The date and time of this log
     */
    Log(message, source, type, datetime = new Date())
    {
        try{
            if(!this.folder) throw new Error("The folder is not defined!");

            let constructedLog = `[${datetime.toLocaleDateString()} ${datetime.toLocaleTimeString()}][${type.toUpperCase()}][${source}]\t${message}`;
            switch(type)
            {   
                default:
                case "message":
                    console.log(cli.blueBright(constructedLog));
                break;

                case "error":
                    console.log(cli.redBright(constructedLog));
                break;

                case "warning":
                    console.log(cli.yellowBright(constructedLog));
                break;
            }

            let filePath = `${this.folder}\\${new Date().toDateString()}.log`;
            fs.appendFileSync(filePath, constructedLog + "\n");
        }
        catch(error)
        {
            console.log(cli.redBright(error.message));
        }
    }

    /**
     *  Sets the new path for logs' folder
     * 
     *  @param {string} newFolder The path to the new folder
     */
    set Folder(newFolder)
    {
        try{
            if(fs.existsSync(__dirname + "\\" + newFolder))
                this.folder = __dirname + "\\" + newFolder;
            else
                throw new Error(`The folder ${__dirname}\\${newFolder} doesn't exist!`);
        }
        catch(error)
        {
            console.log(cli.redBright(error.message));
        }
    }

}


/**
 *  Represents the way how bot will handle
 *  members' commands
 */
module.exports.CommandHandler = class {

    /**
     *  @param {Discord.Client} client Actually the client of the bot
     *  @param {String} commandFolder The folder, where commands are stored
     */
    constructor(client, commandsFolder)
    {
        try{
            //  Commands
            this.commands = new Discord.Collection();

            //  Setting up commands folder
            if(fs.existsSync(__dirname + "\\" + commandsFolder)){
                this.folder = __dirname + "\\" + commandsFolder;

            //  Getting commands
             fs.readdir(this.folder, (err, files) => {
                if(err) throw err;

                let jsFiles = files.filter(f => f.endsWith(".js"));
                
                //  Setting commands
                jsFiles.forEach(val => {
                    let key  = val.replace(".js", "");
                    this.commands.set(key, `${this.folder}\\${val}`);
                    this.client.logs.Log(`Command /${key} is loaded.`, "READY_STATE", "message");
                });
            });
            }
            else{
                throw new Error(`The folder ${__dirname}\\${commandsFolder} doesn't exist!`);
            }

            //  Setting up client
            if(client instanceof Discord.Client)
            {
                this.client = client;
            }
            else{
                throw new Error(`The client must be an instance of Discord.Client!`);
            }
            
        }
        catch(error)
        {
            console.log(cli.redBright(error.message));
        } 
    }

    /**
     *  Tries to handle the command
     * 
     *  @param {String} command The command to handle
     *  @param {Discord.Message} message A discord message which contains this command
     *  @param {Array} args The array of arguments for this command
     *  @param {BetterSqlite3.Database} db The database of this bot
     *  @param {Object} data Any additional data as object
     */
    Handle(command, message, args, db, data)
    {
        try{
            let commandFromList = this.commands.get(command);
            if(commandFromList){ 
                require(commandFromList).run(this.client, message, args, db, data)
                this.client.logs.Log(`${message.author.username} executed /${command} command.`, "COMMAND_HANDLER", "message");
            }
            else
            {
                let commandsAsArray = this.commands.array();
                for(let i = 0; i < commandsAsArray.length; i++)
                {
                    let commandFile = require(commandsAsArray[i]);
                    if(commandFile.data.aliases.includes(command))
                    {
                        commandFile.run(this.client, message, args, db, data);
                        this.client.logs.Log(`${message.author.username} executed /${commandFile.data.name} command.`, "COMMAND_HANDLER", "message");
                        break;
                    }    
                }
            }
        }
        catch(error)
        {
            console.log(cli.redBright(error.message));
        }  
    }

    get Commands()
    {
        return this.commands;
    }
}