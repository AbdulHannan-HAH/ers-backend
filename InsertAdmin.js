const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log("Connected to DB");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const user = new User({
    username: "admin",
    password: hashedPassword,
    role: "Court Admin",
    circuitCourt: null
  });

  await user.save();
  console.log("✅ Admin user created!");
  mongoose.disconnect();
}).catch((err) => {
  console.error("❌ DB Error:", err);
});
