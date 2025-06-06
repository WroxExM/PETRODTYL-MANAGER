const { EmbedBuilder } = require("discord.js");
const { db } = require("../database/database");

module.exports = {
  name: "remove",
  description: "Remove admin role from a user (Discord + SQL)",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("🚫 You don't have permission to use this command.");
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply("❗ Please mention a valid user.");
    }

    // Role ID map
    const rolesMap = {
      staff: process.env.STAFF_ROLE_ID,
      administrator: process.env.ADMIN_ROLE_ID,
      vps: process.env.VPS_ROLE_ID,
      owner: process.env.OWNER_ROLE_ID,
    };

    // Get role from database
    db.get(`SELECT role FROM admins WHERE id = ?`, [target.id], async (err, row) => {
      if (err) {
        console.error(err);
        return message.reply("❌ Database error occurred.");
      }

      if (!row || !rolesMap[row.role]) {
        return message.reply("ℹ️ This user does not have any admin role assigned.");
      }

      const roleName = row.role;
      const roleId = rolesMap[roleName];
      const role = message.guild.roles.cache.get(roleId);

      if (!role) {
        return message.reply("⚠️ That role no longer exists on the server.");
      }

      // Check if member has the role
      if (!target.roles.cache.has(roleId)) {
        return message.reply("⚠️ User does not have the Discord role, but removing from database...");
      }

      try {
        // Remove role from Discord
        await target.roles.remove(role);

        // Remove from database
        db.run(`DELETE FROM admins WHERE id = ?`, [target.id], (err) => {
          if (err) {
            console.error(err);
            return message.reply("❌ Failed to delete from database.");
          }

          // Confirmation embed
          const embed = new EmbedBuilder()
            .setTitle("🗑️ Admin Role Removed")
            .setColor("Red")
            .setDescription(`Removed **${roleName}** role from <@${target.id}>.`)
            .setFooter({ text: "ECH Host Manager" });

          message.channel.send({ embeds: [embed] });
        });
      } catch (error) {
        console.error(error);
        message.reply("❌ Failed to remove role from user. Check bot permissions and role hierarchy.");
      }
    });
  },
};
