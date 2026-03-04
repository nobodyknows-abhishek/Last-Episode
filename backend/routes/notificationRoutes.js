const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

router.route("/").get(protect, getNotifications);
router.route("/read-all").put(protect, markAllAsRead);
router.route("/:id/read").put(protect, markAsRead);

module.exports = router;
