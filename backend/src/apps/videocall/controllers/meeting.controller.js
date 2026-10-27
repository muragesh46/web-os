const crypto = require("crypto");
const Meeting = require("../models/meeting");

const addToMeeting = async (req, res) => {
    try {
        const { meetingId } = req.body;
        const meeting = new Meeting({
            meetingCode: meetingId,
            user_id: req.user?._id ? req.user._id.toString() : "anonymous"
        });
        await meeting.save();
        return res.status(200).json({ message: "Meeting added successfully", meeting });
    } catch (e) {
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const joinMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const meeting = await Meeting.findOne({ meetingCode: meetingId });

        if (meeting) {
            return res.status(200).json({ message: "Meeting Exists", meeting });
        } else {
            return res.status(404).json({ message: "Meeting not found" });
        }
    } catch (e) {
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = {
    addToMeeting,
    joinMeeting
};
