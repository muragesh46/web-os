const mongoose = require("mongoose");
const { Schema } = mongoose;

const meetingschema = new Schema({
    user_id: { type: String },
    meetingCode: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const Meeting = mongoose.model('Meeting', meetingschema);
module.exports = Meeting;