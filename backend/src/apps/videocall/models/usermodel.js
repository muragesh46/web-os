const mongoose = require("mongoose");
const { Schema } = mongoose;

const userschema = new Schema({
    name: { type: String },
    token: { type: String }
});

const User = mongoose.model('VideoCallUser', userschema);
module.exports = User;