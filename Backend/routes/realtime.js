const express = require('express');
const { realTimeService } = require('../services/realtimeService');
const router = express.Router();


/**
 * GET /connect
 * Establish real-time connection for a user
 * Query params:
 *   type = "messages" | "reviews" | "group_participants" | "groups"
 *   id   = groupId OR bookId
 */
router.get("/connect", async (req, res) => {
  try {
    const { type, id } = req.query;

    if (!type || !id) {
      return res.status(400).json({ ok: false, message: "Missing type or id" });
    }

    let channel;

    switch (type) {
      case "messages":
        channel = realTimeService.subscribeToMessages(id, (payload) => {
          console.log("Realtime message payload:", payload);
        });
        break;

      case "reviews":
        channel = realTimeService.subscribeToReviews(id, (payload) => {
          console.log("Realtime review payload:", payload);
        });
        break;

      case "group_participants":
        channel = realTimeService.subscribeToGroupParticipants(id, (payload) => {
          console.log("Realtime participant payload:", payload);
        });
        break;

      case "groups":
        channel = realTimeService.subscribeToGroups(id, (payload) => {
          console.log("Realtime group payload:", payload);
        });
        break;

      default:
        return res.status(400).json({ ok: false, message: "Invalid type" });
    }

    return res.json({
      ok: true,
      message: `Connected & subscribed to ${type}:${id}`,
    });
  } catch (error) {
    console.error("Error in /connect:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * POST /subscribe
 * Subscribe to real-time updates for specific channels
 * Body:
 *   { "type": "messages" | "reviews" | "groups" | "group_participants", "id": "123" }
 */
router.post("/subscribe", async (req, res) => {
  try {
    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({ ok: false, message: "Missing type or id" });
    }

    let channel;

    switch (type) {
      case "messages":
        channel = realTimeService.subscribeToMessages(id, (payload) => {
          console.log("Realtime message payload:", payload);
        });
        break;

      case "reviews":
        channel = realTimeService.subscribeToReviews(id, (payload) => {
          console.log("Realtime review payload:", payload);
        });
        break;

      case "group_participants":
        channel = realTimeService.subscribeToGroupParticipants(id, (payload) => {
          console.log("Realtime participant payload:", payload);
        });
        break;

      case "groups":
        channel = realTimeService.subscribeToGroups(id, (payload) => {
          console.log("Realtime group payload:", payload);
        });
        break;

      default:
        return res.status(400).json({ ok: false, message: "Invalid type" });
    }

    return res.json({
      ok: true,
      message: `Subscribed to ${type}:${id}`,
    });
  } catch (error) {
    console.error("Error in /subscribe:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
