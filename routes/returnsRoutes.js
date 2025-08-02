const express = require('express');
const router = express.Router();
const ReturnAssignment = require('../models/ReturnsAssignment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, verifyAdmin, verifyChief } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/returns-assignments');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Clerk routes
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'Circuit Clerk') return res.status(403).json({ error: 'Only clerks can create reports' });

    const report = new ReturnAssignment({
      ...req.body,
      circuitCourt: user.circuitCourt,
      submittedBy: req.user.userId
    });

    await report.save();
    res.status(201).json(report);
  } catch (err) {
    console.error('Error saving returns assignment:', err); // Add this line
    res.status(500).json({ 
      error: err.message,
      details: err.errors // This will show validation errors if any
    });
  }
});

router.get('/my', verifyToken, async (req, res) => {
  try {
    const reports = await ReturnAssignment.find({ 
      submittedBy: req.user.userId,
      removedByClerk: false 
    }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const report = await ReturnAssignment.findById(req.params.id)
      .populate('submittedBy', 'username');
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/submit/:id', verifyToken, async (req, res) => {
  try {
    const { recipient } = req.body;
    const updateFields = {};
    
    if (recipient === 'admin') updateFields.submittedToAdmin = true;
    if (recipient === 'chief') updateFields.submittedToChief = true;

    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/resubmit/:id', verifyToken, async (req, res) => {
  try {
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      { 
        rejected: false,
        rejectionReason: '',
        finalized: false
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/remove/:id', verifyToken, async (req, res) => {
  try {
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      { removedByClerk: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin routes
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  const rawCourt = req.query.court;
  const court = rawCourt?.trim();

  if (!court) return res.status(400).json({ error: "No court provided" });

  try {
    const reports = await ReturnAssignment.find({
      submittedToAdmin: true,
      circuitCourt: { $regex: new RegExp(`^${court}$`, 'i') }
    })
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/reject/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      { 
        rejected: true,
        rejectionReason: reason,
        submittedToAdmin: false,
        submittedToChief: false
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/view/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      { adminViewed: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chief Justice routes
router.get('/chief/all', verifyToken, verifyChief, async (req, res) => {
  const rawCourt = req.query.court;
  const court = rawCourt?.trim();

  if (!court) return res.status(400).json({ error: "No court provided" });

  try {
    const reports = await ReturnAssignment.find({
      submittedToChief: true,
      circuitCourt: { $regex: new RegExp(`^${court}$`, 'i') }
    })
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/chief/reject/:id', verifyToken, verifyChief, async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      { 
        rejected: true,
        rejectionReason: reason,
        submittedToChief: false
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/chief/view/:id', verifyToken, verifyChief, async (req, res) => {
  try {
    const updated = await ReturnAssignment.findByIdAndUpdate(
      req.params.id,
      { chiefViewed: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// File upload routes
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const reportId = req.body.reportId;
    if (!reportId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Report ID is required' });
    }

    const report = await ReturnAssignment.findById(reportId);
    if (!report) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Report not found' });
    }

    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/returns-assignments/${req.file.filename}`
    };

    const updatedReport = await ReturnAssignment.findByIdAndUpdate(
      reportId,
      { $push: { attachments: fileData } },
      { new: true }
    );

    res.json({ file: fileData });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'File upload failed' });
  }
});

router.delete('/delete-file', verifyToken, async (req, res) => {
  try {
    const { url, reportId } = req.body;
    if (!url || !reportId) {
      return res.status(400).json({ error: 'URL and report ID are required' });
    }

    const filename = url.split('/').pop();
    const filePath = path.join(__dirname, '../uploads/returns-assignments', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await ReturnAssignment.findByIdAndUpdate(
      reportId,
      { $pull: { attachments: { url } } },
      { new: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Clear all reports
router.delete('/admin/clear-all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await ReturnAssignment.deleteMany({});
    res.status(200).json({ message: 'All reports deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear reports' });
  }
});

module.exports = router;