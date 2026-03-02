const express = require("express");
const router = express.Router();
const {
  getMyWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} = require("../controllers/watchlistController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getMyWatchlist);
router.post("/", addToWatchlist);
router.delete("/:id", removeFromWatchlist);

module.exports = router;
