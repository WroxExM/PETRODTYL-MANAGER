const { EmbedBuilder } = require("discord.js");
const { db } = require("../database/database");

const roleMap = {
  staff: process.env.STAFF_ROLE_ID,
  administrator: process.env.ADMIN_ROLE_ID,
  vps: process.env.VPS_ROLE_ID,
  owner: process.env.OWNER_ROLE_ID,
};

module.exports = {
  name: "makeadmin",
  description: "Assign admin roles to a user.",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("You don't have permission to use this command.");
    }

    const user = message.mentions.members.first();
    const roleKey = args[1]?.toLowerCase();
    const validRoles = Object.keys(roleMap);

    if (!user || !validRoles.includes(roleKey)) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Invalid Usage")
        .setDescription(`Usage: \`!makeadmin @user <${validRoles.join("|")}>\``)
        .setColor("#ffcc00");
      return message.channel.send({ embeds: [embed] });
    }

    const newRoleId = roleMap[roleKey];

    // Get current role from database
    db.get(`SELECT role FROM admins WHERE id = ?`, [user.id], async (err, row) => {
      if (err) {
        console.error(err);
        return message.reply("❌ Database error occurred.");
      }

      if (row && row.role === roleKey) {
        const embed = new EmbedBuilder()
          .setTitle("ℹ️ No Change")
          .setDescription(`${user.user.tag} already has the role: **${roleKey}**`)
          .setColor("#ffaa00");
        return message.channel.send({ embeds: [embed] });
      }

      // Remove old role if it exists and is different
      if (row && row.role !== roleKey) {
        const oldRoleId = roleMap[row.role];
        if (oldRoleId && user.roles.cache.has(oldRoleId)) {
          await user.roles.remove(oldRoleId).catch(console.error);
        }
      }

      // Add new role
      if (!user.roles.cache.has(newRoleId)) {
        await user.roles.add(newRoleId).catch(console.error);
      }

      // Update database
      db.run(
        `INSERT OR REPLACE INTO admins (id, role) VALUES (?, ?)`,
        [user.id, roleKey],
        (err) => {
          if (err) {
            console.error(err);
            return message.reply("❌ Failed to update the database.");
          }

          const embed = new EmbedBuilder()
            .setTitle("✅ Role Assigned")
            .setDescription(`${user.user.tag} has been assigned the role: **${roleKey}**`)
            .setColor("#00cc66");

          message.channel.send({ embeds: [embed] });
        }
      );
    });
  }
};
