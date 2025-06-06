const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  description: "Show the bot's response latency and WebSocket ping.",
  async execute(message, args, embedColor) {
    // Step 1: Create "Pinging..." embed
    const pingingEmbed = new EmbedBuilder()
      .setDescription("🏓 Pinging...")
      .setColor("#00ffff"); // Cyan color

    // Step 2: Send the pinging embed
    const sent = await message.reply({ embeds: [pingingEmbed] });

    // Step 3: Wait 3 seconds to simulate loading
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Calculate latencies
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const wsPing = message.client.ws.ping;

    // Step 5: Final ping result embed
    const resultEmbed = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setDescription("Here is the current latency:")
      .addFields(
        { name: "Response Latency", value: `\`${latency}ms\``, inline: true },
        { name: "WebSocket Ping", value: `\`${wsPing}ms\``, inline: true }
      )
      .setColor(embedColor || "#00ffff") // Use ENV color or fallback cyan
      .setTimestamp();

    // Step 6: Edit the message with the result embed
    await sent.edit({ embeds: [resultEmbed] });
  },
};
