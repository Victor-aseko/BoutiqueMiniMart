const express = require('express');
const router = express.Router();
const { registerPushToken } = require('../controllers/pushTokenController');

router.post('/', registerPushToken);

module.exports = router;
