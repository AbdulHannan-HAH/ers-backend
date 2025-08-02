const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Invalid password' });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
            circuitCourt: user.circuitCourt || null

      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        circuitCourt: user.circuitCourt || null,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// CREATE USER
const createUser = async (req, res) => {
  try {
    const { username, role, circuitCourt } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ msg: 'Username already exists' });
    }

    const generatedPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      role,
      circuitCourt: role === 'Circuit Clerk' ? circuitCourt : undefined,
    });

    await newUser.save();

    res.status(201).json({
      msg: 'User created successfully',
      username: newUser.username,
      password: generatedPassword,
    });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// ✅ FIXED: EXPORT ALL 3 TOGETHER
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch users', error: err.message });
  }
};

module.exports = {
  loginUser,
  createUser,
  getAllUsers, // ✅ This was missing before
};
// DELETE a user
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Delete failed" });
  }
};

// UPDATE username/password
const updateUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const updatedData = {};
    if (username) updatedData.username = username;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updatedData.password = hashed;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).json({ msg: "User updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ msg: "Update failed", error: err.message });
  }
};

module.exports = {
  loginUser,
  createUser,
  getAllUsers,
  deleteUser,
  updateUser
};

