/*const { EmbedBuilder } = require("discord.js");
const { db } = require("../database/database");
const { getNodeStats } = require("../utils/pterodactyl");

module.exports = {
  name: "nodes",
  description: "Display live VPS node usage stats.",
  async execute(message, args) {
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    const minutes = parseInt(args[0]);
    if (isNaN(minutes) || minutes < 1 || minutes > 120) {
      return message.reply("❌ Please specify a valid number of minutes (e.g., `5`, `30`, `60`), max 120.");
    }

    const duration = minutes * 60 * 1000;

    db.get(`SELECT * FROM monitoring WHERE guild_id = ?`, [guildId], async (err, row) => {
      if (err) {
        console.error("DB error:", err);
        return message.reply("❌ Database error occurred.");
      }

      if (row) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("⚠️ Monitoring Already Active")
              .setDescription(`Live monitoring is already running in <#${row.channel_id}>.`)
              .setColor("#ff4444")
          ]
        });
      }

      // Insert monitoring session into DB
      db.run(`INSERT INTO monitoring (guild_id, channel_id) VALUES (?, ?)`, [guildId, channelId]);

      // Fetch initial stats
      let sentMsg;
      try {
        const stats = await getNodeStats();

        const statsEmbed = new EmbedBuilder()
          .setTitle("📊 Live VPS Node Stats")
          .setColor("#00cc00")
          .setTimestamp();

        if (!stats || stats.length === 0) {
          statsEmbed.setDescription("⚠️ No node data found.");
        } else {
          for (const node of stats) {
            statsEmbed.addFields({
              name: `🖥️ ${node.name}`,
              value:
                `> **RAM:** ${node.memory.used} / ${node.memory.total} MB\n` +
                `> **Disk:** ${node.disk.used} / ${node.disk.total} MB\n` +
                `> **CPU:** ${node.cpu.used}%\n` +
                `> **Ping:** ${node.ping} ms`,
              inline: false
            });
          }
        }

        sentMsg = await message.channel.send({ embeds: [statsEmbed] });

      } catch (err) {
        console.error("Initial stats fetch failed:", err);
        await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Failed to fetch initial VPS stats.")
              .setColor("#ff0000")
          ]
        });
        db.run(`DELETE FROM monitoring WHERE guild_id = ?`, [guildId]);
        return;
      }

      // Start auto-update every 10 seconds
      const intervalId = setInterval(async () => {
        try {
          const stats = await getNodeStats();

          const statsEmbed = new EmbedBuilder()
            .setTitle("📊 Live VPS Node Stats")
            .setColor("#00cc00")
            .setTimestamp();

          if (!stats || stats.length === 0) {
            statsEmbed.setDescription("⚠️ No node data found.");
          } else {
            for (const node of stats) {
              statsEmbed.addFields({
                name: `🖥️ ${node.name}`,
                value:
                  `> **RAM:** ${node.memory.used} / ${node.memory.total} MB\n` +
                  `> **Disk:** ${node.disk.used} / ${node.disk.total} MB\n` +
                  `> **CPU:** ${node.cpu.used}%\n` +
                  `> **Ping:** ${node.ping} ms`,
                inline: false
              });
            }
          }

          await sentMsg.edit({ embeds: [statsEmbed] });

        } catch (err) {
          console.error("Update fetch failed:", err);
          await sentMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Error")
                .setDescription("An error occurred while fetching VPS stats.")
                .setColor("#ff0000")
            ]
          });
          clearInterval(intervalId);
          db.run(`DELETE FROM monitoring WHERE guild_id = ?`, [guildId]);
        }
      }, 10000); // every 10 seconds

      // Stop after duration ends
      setTimeout(async () => {
        clearInterval(intervalId);
        db.run(`DELETE FROM monitoring WHERE guild_id = ?`, [guildId]);

        try {
          await sentMsg.delete();
        } catch (err) {
          console.warn("Failed to delete live stats message:", err.message);
        }

        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("✅ Monitoring Ended")
              .setDescription(`VPS resource monitoring ended after **${minutes} minutes**.`)
              .setColor("#00cc00")
          ]
        });
      }, duration);
    });
  }
};
*/