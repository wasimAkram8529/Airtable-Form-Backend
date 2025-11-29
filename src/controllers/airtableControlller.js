const createAirtableClient = require("../utils/airtableClient");

const SUPPORTED_FIELD_TYPES = [
  "singleLineText",
  "longText",
  "singleSelect",
  "multipleSelects",
  "multipleAttachments",
];

const getAllBases = async (req, res) => {
  const client = createAirtableClient(req.user.airtableTokens.accessToken);
  try {
    const bases = await client.listBases();
    res.json(bases);
  } catch (error) {
    console.log("Error message:", error.message);
    if (error.status === 401)
      return res.status(401).json({ error: "Unauthorized, Please login" });

    res.status(error.status).json({ error: error.message });
  }
};

const getAllTables = async (req, res) => {
  const client = createAirtableClient(req.user.airtableTokens.accessToken);
  try {
    const tables = await client.listTables(req.params.baseId);
    res.json(tables);
  } catch (error) {
    if (error.status === 401)
      return res.status(401).json({ error: "Unauthorized, Please login" });

    res.status(500).json({ error: error.message });
  }
};

const getAllFields = async (req, res) => {
  const client = createAirtableClient(req.user.airtableTokens.accessToken);
  try {
    const tables = await client.listTables(req.params.baseId);
    const table = tables.find((table) => table.id === req.params.tableId);

    if (!table) return res.status(404).json({ error: "Table not found" });

    const supportedFields = table.fields.filter((field) =>
      SUPPORTED_FIELD_TYPES.includes(field.type)
    );
    res.json(supportedFields);
  } catch (error) {
    if (error.status === 401)
      return res.status(401).json({ error: "Unauthorized, Please login" });

    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllBases,
  getAllFields,
  getAllTables,
};
