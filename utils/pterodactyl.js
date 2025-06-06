const axios = require("axios");
require("dotenv").config();

const PTERO_API = process.env.PTERO_API;
const PTERO_API_KEY = process.env.PTERO_API_KEY;

if (!PTERO_API || !PTERO_API_KEY) {
  console.error("❌ Missing PTERO_API or PTERO_API_KEY in .env");
  process.exit(1);
}

async function validatePterodactylAPI() {
  try {
    const res = await axios.get(`${PTERO_API}/api/client`, {
      headers: {
        Authorization: `Bearer ${PTERO_API_KEY}`,
        Accept: "Application/json"
      }
    });

    return res.status === 200;
  } catch (error) {
    console.error("❌ Pterodactyl API validation failed:", error.response?.data || error.message);
    return false;
  }
}


async function getServerStatsByUUID(uuid) {
  try {
    const response = await axios.get(`${process.env.PTERO_API}/api/client`, {
      headers: {
        Authorization: `Bearer ${process.env.PTERO_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    const servers = response.data.data;
    const server = servers.find(s => s.attributes.uuid === uuid);
    return server ? server.attributes : null;
  } catch (err) {
    console.error('Failed to fetch server stats:', err);
    return null;
  }
}


module.exports = 
{
  validatePterodactylAPI,
  getServerStatsByUUID

};
