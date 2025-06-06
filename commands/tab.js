const { EmbedBuilder } = require("discord.js");
const { db } = require("../database/database");

module.exports = {
  name: "tab",
  description: "Display all admin roles assigned by the bot.",
  async execute(message) {
    db.all(`SELECT * FROM admins`, async (err, rows) => {
      if (err) {
        console.error(err);
        return message.reply("❌ Database error occurred.");
      }

      if (!rows || rows.length === 0) {
        return message.reply("⚠️ No admins have been assigned yet.");
      }

      const grouped = {
        owner: [],
        administrator: [],
        vps: [],
        staff: [],
      };

      rows.forEach(row => {
        if (grouped[row.role]) grouped[row.role].push(`<@${row.id}>`);
      });

      const total = rows.length;
      const fields = [];

      if (grouped.owner.length) {
        fields.push({
          name: "👑 __Owners__",
          value: grouped.owner.join("\n"),
          inline: false
        });
      }

      if (grouped.administrator.length) {
        fields.push({
          name: "🛠️ __Administrators__",
          value: grouped.administrator.join("\n"),
          inline: false
        });
      }

      if (grouped.vps.length) {
        fields.push({
          name: "💻 __VPS Access__",
          value: grouped.vps.join("\n"),
          inline: false
        });
      }

      if (grouped.staff.length) {
        fields.push({
          name: "🧑‍💼 __Staff__",
          value: grouped.staff.join("\n"),
          inline: false
        });
      }

      fields.push({
        name: "📊 __Total Admins__",
        value: `\`\`\`yaml\nTotal: ${total} Admin(s)\n\`\`\``,
        inline: false
      });

      const embed = new EmbedBuilder()
        .setTitle("👑 Administrator Views")
        .setDescription("📘 **Echo Cloud Hosting Admin Panel**\n━━━━━━━━━━━━━━━━━━━━")
        .setColor("#3498db")
        .addFields(fields)
        .setFooter({ text: "ECH Bot Admin System • Powered by Echo" });

      message.channel.send({ embeds: [embed] });
    });
  }
};
