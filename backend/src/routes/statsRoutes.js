const express = require('express');
const router = express.Router();
const {
  getStatsSummary,
  getAgencyLeaderboard,
  getDestinationAnalytics,
  getPackagePerformance,
} = require('../controllers/statsController');

router.get('/summary', getStatsSummary);
router.get('/agencies/leaderboard', getAgencyLeaderboard);
router.get('/destinations/analytics', getDestinationAnalytics);
router.get('/packages/performance', getPackagePerformance);

module.exports = router;