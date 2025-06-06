const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeserver')
    .setDescription('Forcefully remove a user\'s VPS record from the database (does NOT delete from Pterodactyl).')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose VPS record you want to remove')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('uuid')
        .setDescription('UUID of the VPS (as stored in database)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Why is this server being removed?')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');
    const uuid = interaction.options.getString('uuid');
    const reason = interaction.options.getString('reason');
    const admin = interaction.user;
    const timeNow = new Date().toLocaleString();

    // Step 1: Confirm from DB
    db.get(`SELECT * FROM user_servers WHERE user_id = ? AND server_uuid = ?`, [user.id, uuid], async (err, row) => {
      if (err) {
        console.error('DB error:', err);
        return interaction.editReply({ content: '❌ Database access error.' });
      }

      if (!row) {
        return interaction.editReply({ content: '❌ No VPS record found for this user with that UUID.' });
      }

      // Step 2: Delete from DB
      db.run(`DELETE FROM user_servers WHERE user_id = ? AND server_uuid = ?`, [user.id, uuid], async (delErr) => {
        if (delErr) {
          console.error('DB delete error:', delErr);
          return interaction.editReply({ content: '❌ Could not remove the record from the database.' });
        }

        // Step 3: DM Notification Embed (Title only)
        const dmHeader = new EmbedBuilder()
          .setTitle('⚠ VPS Record Removal Notification')
          .setColor(0xF1C40F) // Yellow
          .setDescription(
            `This is an official notice from **Echo Cloud Hosting**.\n` +
            `A VPS record associated with your account has been removed from our database.`
          )
          .setFooter({ text: 'ECH Host Manager | Automated Notice' })
          .setTimestamp();

        // Step 4: DM Details Embed (Reason & Metadata)
        const dmDetails = new EmbedBuilder()
          .setColor(0xF1C40F)
          .addFields(
            { name: 'UUID Removed', value: `\`${uuid}\`` },
            { name: 'Reason', value: `>>> ${reason}` },
            { name: 'Note', value: '⚠ Your actual VPS on the panel **has NOT been deleted**.\nIf you have questions, please contact support.' }
          )
          .setFooter({ text: 'ECH Host Manager | Record Deletion Info' })
          .setTimestamp();

        try {
          await user.send({ embeds: [dmHeader, dmDetails] });
        } catch (dmErr) {
          console.warn('DM failed:', dmErr);
        }

        // Step 5: Channel Log Embed
        const logEmbed = new EmbedBuilder()
          .setTitle(' ** SERVER REMOVING . **')
          .setColor(0xF1C40F)
          .addFields(
            { name: 'Removed By', value: `${admin.tag}`, inline: true },
            { name: 'User', value: `${user.tag}`, inline: true },
            { name: 'UUID', value: `\`${uuid}\`` },
            { name: 'Reason', value: `>>> ${reason}` },
            { name: 'Time', value: `\`${timeNow}\`` }
          )
          .setFooter({ text: 'ECH Host Manager | Admin Action Logged' })
          .setTimestamp();

        await interaction.channel.send({ content: `${user}`, embeds: [logEmbed] });

        // Step 6: Admin Confirmation
        await interaction.editReply({
          content: `✅ Succesfully  \`${uuid}\` has been **removed from the database** for ${user.tag}.`,
        });
      });
    });
  },
};
