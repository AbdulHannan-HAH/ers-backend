const express = require('express');
const router = express.Router();
const ReturnAssignment = require('../models/ReturnsAssignment');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// ✅ Clerk: Submit Return Assignment
router.post('/', verifyToken, async (req, res) => {
  try {
    const assignment = new ReturnAssignment({
      userId: req.user.userId,
      circuitCourt: req.body.circuitCourt,
      ...req.body
    });
    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ msg: 'Server Error', error: error.message });
  }
});

// ✅ Clerk: Get their own submitted reports
router.get('/my', verifyToken, async (req, res) => {
  try {
    const data = await ReturnAssignment.find({ userId: req.user.userId });
    res.json(data);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fetch', error: error.message });
  }
});

// ✅ Clerk: Send report to Admin
router.patch('/send/:id', verifyToken, async (req, res) => {
  try {
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      { submittedToAdmin: true },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to send', error: error.message });
  }
});

// ✅ Admin: Fetch all submitted reports (only those submittedToAdmin = true)
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const reports = await ReturnAssignment.find({ submittedToAdmin: true })
      .populate('userId', 'username circuitCourt role')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch reports', error: err.message });
  }
});

// ✅ Admin: Mark a report as viewed
router.patch('/view/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      { adminViewed: true },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to mark viewed', error: error.message });
  }
});

// ✅ Clerk: Update own report (optional)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: 'Update failed', error: error.message });
  }
});

module.exports = router;
