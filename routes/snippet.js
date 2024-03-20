const express = require("express");
const router = express.Router();
const { createSnippet, getSnippets } = require("../controller/snippet");

router.get("/", getSnippets);
router.post("/create", createSnippet);

module.exports = router;
