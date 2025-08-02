// models/User.js
const mongoose = require('mongoose');

// Define schema for users
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // unique username
  password: { type: String, required: true }, // hashed password
  role: { 
    type: String, 
    enum: ['Court Admin', 'Circuit Clerk', 'Chief Justice'], // only 3 roles allowed
    required: true 
  },
  circuitCourt: { type: String } // only needed for clerk
});

// Export model
module.exports = mongoose.model('User', userSchema);
