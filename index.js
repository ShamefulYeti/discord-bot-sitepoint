require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const { exec } = require("child_process");

var dockerCLI = require('docker-cli-js');
var DockerOptions = dockerCLI.Options;
var Docker = dockerCLI.Docker;

   var options = new DockerOptions(
    /* machinename */ null,
    /* currentWorkingDirectory */ null,
    /* echo */ true,
   );

   var docker = new Docker(options);


bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

const prefix = "!YB ";

bot.on("message", function(message) {

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
  }

  else if (command === "sum") {
    console.log(args);
    const numArgs = args.map(x => parseFloat(x));
    const sum = numArgs.reduce((counter, x) => counter += x);
    message.reply(`The sum of all the arguments you provided is ${sum}!`);


  } else if (command === "status") {

    console.log(`Status Request from: ${message.author.username}`);
    const allowedContainers = ["valheim-server"];
    const container = (args[0]) ? args[0] : "valheim-server";
    const frmtCodeBlock = "```";

    if (allowedContainers.includes(container)) {
      docker.command(`ps -a -f "name=${container}" --format "{{.ID}} - {{.Names}} : {{.Status}}"`).then((status) => {

        docker.command(`logs -n 5 -f ${container}`).then((data) => {
          message.reply(`Current status & logs from the server.\n**Status:** ${status.raw}\n${frmtCodeBlock}${data.raw}${frmtCodeBlock}`);
        });
      }).catch((error) => {
        message.reply(`Error: ${error}\n`);
      });

    }
  } else if (command ==="stop") {
    // console.log(args);
    const allowedContainers = ["valheim-server"];
    const container = args[0];
    if (allowedContainers.includes(container)) {
      message.reply(`The bot will now shut down: ${container}`);
      message.reply(`Confirm with a thumb up or deny with a thumb down.`).then((reply) => {
        reply.react('👍').then(r => { reply.react('👎');});
        reply.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '👍' || reaction.emoji.name == '👎'),
          { max: 1, time: 30000 }).then(collected => {
            if (collected.first().emoji.name == '👍') {

              reply.edit('Confirmation received. Shutting down the server.');
              exec(`docker stop ${container}`, (error, stdout, stderr) => {
                if (error) {
                  console.log(`error: ${error.message}`);
                  return;
                }
              });
              reply.react('🤔');
              exec(`docker wait ${container}`, (error, stdout, stderr) => {
                reply.react('✅').then(() => {
                  exec(`docker ps -a -f "name=${container}" --format "{{.ID}} - {{.Names}} : {{.Status}}"`,  (error, stdout, stderr) => {
                  reply.edit(`Container Status: \n ${stdout}`);
                  });
                  reply.clearReactions();
                });
              });




            }
            else
              reply.edit('Operation canceled.');
          }).catch(() => {
              reply.edit('No reaction after 30 seconds, operation canceled');
          });
      });







    } else {
      message.reply(`Container: ${container} not recognised.`);
    }


  } else if (command ==="start") {
    // console.log(args);
    const allowedContainers = ["valheim-server"];
    const container = args[0];
    if (allowedContainers.includes(container)) {
      message.reply(`The bot will now start: ${container}`);
      message.reply(`Confirm with a thumb up or deny with a thumb down.`).then((reply) => {
        reply.react('👍').then(r => { reply.react('👎');});
        reply.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '👍' || reaction.emoji.name == '👎'),
          { max: 1, time: 30000 }).then(collected => {
            if (collected.first().emoji.name == '👍') {

              reply.edit('Confirmation received. Starting the server.');
              exec(`docker start ${container}`, (error, stdout, stderr) => {
                if (error) {
                  console.log(`error: ${error.message}`);
                  return;
                }
              });
              reply.react('🤔');
              exec(`docker wait ${container}`, (error, stdout, stderr) => {
                reply.edit("Server has been started, please give it a few mins to bootup.");
                reply.clearReactions();
              });
            }
            else
              reply.edit('Operation canceled.');
              reply.clearReactions();
          }).catch(() => {
              reply.edit('No reaction after 30 seconds, operation canceled');
              reply.clearReactions();
          });
      });







    } else {
      message.reply(`Container: ${container} not recognised.`);
    }


  }
});
