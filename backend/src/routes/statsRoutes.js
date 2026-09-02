const express = require('express');
const router = express.Router();
const { getStatsSummary } = require('../controllers/statsController');

router.get('/summary', getStatsSummary);

module.exports = router;