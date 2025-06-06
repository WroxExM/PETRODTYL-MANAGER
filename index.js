require("dotenv").config();
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require("discord.js");
const { initializeDatabase, checkDatabaseStatus } = require("./database/database");
const { validatePterodactylAPI } = require("./utils/pterodactyl");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.commands = new Map(); // For prefix
client.slashCommands = new Collection(); // For slash

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

// Load both prefix and slash commands
const slashCommandsData = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.name) client.commands.set(command.name, command); // Prefix

  if (command.data) {
    client.slashCommands.set(command.data.name, command); // Slash
    slashCommandsData.push(command.data.toJSON());
  }
}

// Slash Command Registration
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(chalk.cyan(`[Registering slash commands for ${process.env.GUILD_ID}]`));
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: slashCommandsData }
    );
    console.log(chalk.green("✅ Slash commands registered successfully."));
  } catch (error) {
    console.error("❌ Slash command registration failed:", error);
  }
})();

// Start up
client.once("ready", async () => {
  console.clear();
  console.log(chalk.yellow("======================================="));
  console.log(chalk.cyan(`[1/8] Initializing ECH Host Manager...`));
  await wait(1500);

  console.log(chalk.cyan(`[2/8] Loading core modules...`));
  await wait(1500);

  console.log(chalk.cyan(`[3/8] Connecting to Discord Gateway...`));
  await wait(1500);

  console.log(chalk.cyan(`[4/8] Logged in as: ${client.user.tag}`));
  await wait(1500);

  console.log(chalk.cyan(`[5/8] Validating Pterodactyl API key...`));
  const apiKeyValid = await validatePterodactylAPI();
  await wait(1500);
  if (apiKeyValid) {
    console.log(chalk.green(`        ✅ API key is valid.`));
  } else {
    console.log(chalk.red(`        ❌ API key is invalid.`));
  }

  console.log(chalk.cyan(`[6/8] Verifying database integrity...`));
  const dbStatus = await checkDatabaseStatus();
  await wait(1500);
  if (dbStatus.exists) {
    console.log(chalk.green(`        ✅ Database found.`));
    console.log(chalk.cyan(`        Path: ${dbStatus.path}`));
    console.log(chalk.cyan(`        Last Edited: ${dbStatus.lastModified}`));
  } else {
    console.log(chalk.yellow(`        ⚠ No database found. Creating new database...`));
  }

  console.log(chalk.cyan(`[7/8] Establishing database connection...`));
  await initializeDatabase();
  await wait(1500);
  console.log(chalk.green(`        🗄️ Connected to the SQLite database.`));

  console.log(chalk.cyan(`[8/8] Finalizing startup...`));
  await wait(1500);

  console.log(chalk.green(`✅ ECH Host Manager is now online and fully operational!`));
  console.log(chalk.yellow("======================================="));
});

// PREFIX command handler
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;
  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (command) {
    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(error);
      message.reply("There was an error executing that command.");
    }
  }
});

// SLASH command handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
  }
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(process.env.TOKEN);
