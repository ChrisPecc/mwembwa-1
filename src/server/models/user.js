const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema({
    name: {type: String},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    leaves: {type: Number},
    color: {type: String},
    lastPay: {type: Number},
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
