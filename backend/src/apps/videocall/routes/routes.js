const { Router } = require("express");
const { addToMeeting, joinMeeting } = require("../controllers/meeting.controller.js");
const router = Router();

router.post("/add_activity", addToMeeting);
router.get("/join_meeting/:meetingId", joinMeeting);

module.exports = router;