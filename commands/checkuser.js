const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../database/database');
const { getServerStatsByUUID } = require('../utils/pterodactyl');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkuser')
    .setDescription('Check assigned Servers servers of a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: false });
    const fetchingMsg = await interaction.channel.send('🔍 Fetching servers...');

    db.all(`SELECT DISTINCT server_uuid FROM user_servers WHERE user_id = ?`, [user.id], async (err, rows) => {
      if (err) {
        console.error('DB Error:', err);
        await fetchingMsg.delete().catch(() => {});
        return interaction.editReply({ content: '❌ Database error occurred.' });
      }

      if (rows.length === 0) {
        await fetchingMsg.delete().catch(() => {});
        return interaction.editReply({ content: `⚠️ No Servers assigned to **${user.tag}**.` });
      }

      const grouped = {};
      const usedUUIDs = new Set();

      for (const row of rows) {
        if (usedUUIDs.has(row.server_uuid)) continue;
        usedUUIDs.add(row.server_uuid);

        try {
          const server = await getServerStatsByUUID(row.server_uuid);
          if (server) {
            const match = server.name.match(/type\s*:?[\s]*([0-9]+)/i);
            const type = match ? match[1] : 'Unknown';

            if (!grouped[type]) grouped[type] = [];

            grouped[type].push({
              name: server.name,
              cpu: `${server.limits.cpu}%`,
              ram: `${server.limits.memory} MB`,
              disk: `${server.limits.disk} MB`
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch server ${row.server_uuid}:`, error);
        }
      }

      if (Object.keys(grouped).length === 0) {
        await fetchingMsg.delete().catch(() => {});
        return interaction.editReply({ content: `⚠️ No valid servers found for **${user.tag}**.` });
      }

      let description = '';

      Object.keys(grouped)
        .sort((a, b) => Number(a) - Number(b))
        .forEach(type => {
          description += `**🗂️ Type ${type} Servers Servers**\n`;

          grouped[type].forEach((srv, i) => {
            const name = srv.name.length > 28 ? srv.name.slice(0, 25) + "..." : srv.name;
            const longest = Math.max(name.length, 28);
            const line = (label, val) => `| ${label.padEnd(6)}: ${val.padEnd(longest - 9)} |`;

            const box = [
              `+${'-'.repeat(longest + 4)}+`,
              `| [${i + 1}] ${name.padEnd(longest)} |`,
              line('CPU', srv.cpu),
              line('RAM', srv.ram),
              line('DISK', srv.disk),
              `+${'-'.repeat(longest + 4)}+`
            ];

            description += '```ansi\n' + box.join('\n') + '\n```\n';
          });

          description += `\n`; // space between types
        });

      const embed = new EmbedBuilder()
        .setTitle(`📦 Servers Overview for ${user.username}`)
        .setDescription(description.trim().slice(0, 4000)) // Discord limit safety
        .setColor(0x1abc9c)
        .setFooter({ text: `Total Servers Servers: ${rows.length}` })
        .setTimestamp();

      await fetchingMsg.delete().catch(() => {});
      await interaction.editReply({ content: '', embeds: [embed] });
    });
  }
};
