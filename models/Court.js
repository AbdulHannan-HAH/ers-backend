// models/Court.js
const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Court', courtSchema);
