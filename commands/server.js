const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

const PTERO_API = process.env.PTERO_API;
const PTERO_API_KEY = process.env.PTERO_API_KEY;

module.exports = {
  name: "servers",
  description: "Show all Servers from the Pterodactyl panel.",
  async execute(message) {
    try {
      const response = await axios.get(`${PTERO_API}/api/application/servers`, {
        headers: {
          Authorization: `Bearer ${PTERO_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "Application/vnd.pterodactyl.v1+json",
        },
      });

      const servers = response.data.data;
      if (!servers.length) {
        return message.reply("❌ No servers found.");
      }

      const serverList = servers.map((server, index) => {
        const name = server.attributes.name || "Unnamed Server";
        return `__${index + 1}.__ **${name}**`;
      });

      const embed = new EmbedBuilder()
        .setTitle("__🔧 Servers__")
        .setDescription(serverList.join("\n\n")) // double spacing for better visuals
        .setColor("#FF0000")
        .setFooter({ text: `📌 Total Servers: ${servers.length}` });

      message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error("Pterodactyl API Error:", error.response?.data || error.message);
      message.reply("❌ Failed to fetch servers from Pterodactyl.");
    }
  },
};
