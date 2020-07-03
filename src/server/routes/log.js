const express = require("express");
const router = express.Router();
const logCtrl = require("../controllers/log");
const auth = require("../middleware/auth");

router.get("/", auth, logCtrl.getAllLogs);

module.exports = router;
