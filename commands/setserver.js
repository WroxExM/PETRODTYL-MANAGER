const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/database');
const { getServerStatsByUUID } = require('../utils/pterodactyl');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setserver')
    .setDescription('Assign a Server to a user by UUID.')
    .addUserOption(option =>
      option.setName('user').setDescription('User to assign the server to').setRequired(true))
    .addStringOption(option =>
      option.setName('uuid').setDescription('UUID of the Pterodactyl server').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');
    const uuid = interaction.options.getString('uuid');

    try {
      db.run(`CREATE TABLE IF NOT EXISTS user_servers (user_id TEXT, server_uuid TEXT)`, () => {
        // Check if the server UUID is already assigned
        db.get(`SELECT * FROM user_servers WHERE server_uuid = ?`, [uuid], async (err, row) => {
          if (err) {
            console.error(err);
            return interaction.editReply({ content: '❌ Database error occurred.' });
          }

          if (row) {
            return interaction.editReply({
              content: `⚠️ This server is already assigned to <@${row.user_id}>.`,
              allowedMentions: { users: [] }
            });
          }

          // If not already assigned, proceed with insertion
          db.run(`INSERT INTO user_servers (user_id, server_uuid) VALUES (?, ?)`, [user.id, uuid], async (insertErr) => {
            if (insertErr) {
              console.error(insertErr);
              return interaction.editReply({ content: '❌ Failed to save server assignment.' });
            }

            const serverInfo = await getServerStatsByUUID(uuid);
            if (!serverInfo) {
              return interaction.editReply({ content: '⚠️ Could not fetch server details.' });
            }

            // ------------- DM EMBEDS -------------
            const dmEmbed1 = new EmbedBuilder()
              .setTitle('** SERVER ASSIGNMENT **')
              .setColor(0xFF0000)
              .setDescription(
                `📦 __You’ve been assigned a Server from Echo Cloud Host!__\n\n` +
                `__Hostname:__ \`${serverInfo.name}\`\n\n` +
                `__Specs:__\n` +
                `> CPU: \`${serverInfo.limits.cpu}%\`\n` +
                `> RAM: \`${serverInfo.limits.memory} MB\`\n` +
                `> Disk: \`${serverInfo.limits.disk} MB\``
              )
              .setFooter({ text: 'Echo Cloud Host' })
              .setTimestamp();

            const dmEmbed2 = new EmbedBuilder()
              .setTitle(' ** CONTROL PANEL ACCESS ** ')
              .setColor(0xFF0000)
              .setDescription(
                `🔐 [Login Panel](https://echocloudhosting.shop/auth/login)\n` +
                `🗄️ [PhpMyAdmin](https://echocloudhosting.shop/phpmyadmin)`
              );

            try {
              await user.send({ embeds: [dmEmbed1, dmEmbed2] });
            } catch (dmErr) {
              console.warn('⚠️ Could not DM user:', dmErr);
            }

            // ------------- CHANNEL EMBEDS -------------
            const channelEmbed1 = new EmbedBuilder()
              .setTitle('** Servers DETAILS **')
              .setColor(0xFF0000)
              .setDescription(
                `__Hostname:__ \`${serverInfo.name}\`\n\n` +
                `__Resources:__\n` +
                `> CPU: \`${serverInfo.limits.cpu}%\`\n` +
                `> RAM: \`${serverInfo.limits.memory} MB\`\n` +
                `> Disk: \`${serverInfo.limits.disk} MB\``
              );

            const channelEmbed2 = new EmbedBuilder()
              .setTitle('** CONTROL PANEL LINKS **')
              .setColor(0xFF0000)
              .setDescription(
                `🔐 [Login Panel](https://echocloudhosting.shop/auth/login)\n` +
                `🗄️ [PhpMyAdmin](https://echocloudhosting.shop/phpmyadmin)`
              );

            const channelEmbed3 = new EmbedBuilder()
              .setTitle('** SERVER ASSIGNED **')
              .setColor(0xFF0000)
              .setDescription(`✅ Server assigned to ${user}. DM sent with full details.`)
              .setFooter({ text: 'ECH Host Manager' })
              .setTimestamp();

            const msg1 = await interaction.channel.send({ embeds: [channelEmbed1] });
            const msg2 = await interaction.channel.send({ embeds: [channelEmbed2] });
            const msg3 = await interaction.channel.send({ content: `${user}`, embeds: [channelEmbed3] });

            try {
              await msg3.pin();
            } catch (pinErr) {
              console.warn('⚠️ Could not pin message:', pinErr);
            }

            await interaction.editReply({ content: `✅ Server assigned to ${user.tag} successfully.` });
          });
        });
      });
    } catch (err) {
      console.error('Command error:', err);
      await interaction.editReply({ content: '❌ An unexpected error occurred.' });
    }
  }
};
