const axios = require("axios");

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

function createAirtableClient(accessToken) {
  const airtableClient = axios.create({
    baseURL: AIRTABLE_API_BASE,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return {
    async whoAmI() {
      const res = await axios.get(`${AIRTABLE_API_BASE}/meta/whoami`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return res.data;
    },

    async listBases() {
      const res = await axios.get(`${AIRTABLE_API_BASE}/meta/bases`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return res.data.bases;
    },

    async listTables(baseId) {
      const res = await axios.get(
        `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return res.data.tables;
    },

    async createRecord(baseId, tableId, fields) {
      const res = await airtableClient.post(`/${baseId}/${tableId}`, {
        fields,
      });
      return res.data;
    },
  };
}

module.exports = createAirtableClient;
