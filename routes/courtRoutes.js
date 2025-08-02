// routes/courtRoutes.js
const express = require('express');
const router = express.Router();
const Court = require('../models/Court');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Get all courts
router.get('/', verifyToken, async (req, res) => {
  try {
    const courts = await Court.find();
    res.json(courts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new court
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const court = new Court({ name: req.body.name });
    await court.save();
    res.status(201).json(court);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete court
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await Court.findByIdAndDelete(req.params.id);
    res.json({ msg: "Court deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
