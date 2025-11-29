const express = require("express");
const { authUser } = require("../middleware/auth");
const {
  getAllBases,
  getAllTables,
  getAllFields,
} = require("../controllers/airtableControlller");

const router = express.Router();

router.use(authUser);

router.get("/bases", getAllBases);

router.get("/bases/:baseId/tables", getAllTables);

router.get("/bases/:baseId/tables/:tableId/fields", getAllFields);

module.exports = router;
