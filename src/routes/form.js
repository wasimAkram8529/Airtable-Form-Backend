const express = require("express");
const {
  createForm,
  getForms,
  getForm,
  createResponse,
  getResponses,
  exportResponses,
} = require("../controllers/formController");

const router = express.Router();

router.post("/", authUser, createForm);

router.get("/", getForms);

router.get("/:formId", getForm);

router.post("/:formId/responses", createResponse);

router.get("/:formId/responses", getResponses);

router.get("/:formId/responses/export", exportResponses);

module.exports = router;
