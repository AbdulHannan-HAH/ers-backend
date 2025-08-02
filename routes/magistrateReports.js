const express = require('express');
const router = express.Router();
const MagistrateReport = require('../models/MagistrateReport');
const { verifyToken, verifyAdmin, verifyChief } = require('../middleware/authMiddleware');
const User = require("../models/User");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Clerk routes
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'Circuit Clerk') return res.status(403).json({ error: 'Only clerks can create reports' });

    const report = new MagistrateReport({
      ...req.body,
      magistrateName: req.body.magistrateName,
      magisterialCourt: req.body.deposits[0]?.court || 'Unknown',
      clerkCourt: user.circuitCourt,
      submittedBy: req.user.userId
    });

    await report.save();
    res.status(201).json(report);
  } catch (err) {
    console.error("Error creating report:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', verifyToken, async (req, res) => {
  try {
    const reports = await MagistrateReport.find({ submittedBy: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const report = await MagistrateReport.findById(req.params.id);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updated = await MagistrateReport.findByIdAndUpdate(
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

    const updated = await MagistrateReport.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject route for admin
router.patch('/admin/reject/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await MagistrateReport.findByIdAndUpdate(
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

// Reject route for chief
router.patch('/chief/reject/:id', verifyToken, verifyChief, async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await MagistrateReport.findByIdAndUpdate(
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

// Resubmit route for clerk
router.patch('/resubmit/:id', verifyToken, async (req, res) => {
  try {
    const updated = await MagistrateReport.findByIdAndUpdate(
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

// Admin routes
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  const rawCourt = req.query.court;
  const court = rawCourt?.trim();

  if (!court) return res.status(400).json({ error: "No court provided" });

  try {
    const reports = await MagistrateReport.find({
      submittedToAdmin: true,
      clerkCourt: { $regex: new RegExp(`^${court}$`, 'i') }
    })
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error("Error in admin/all route:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/view/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await MagistrateReport.findByIdAndUpdate(
      req.params.id,
      { adminViewed: true },
      { new: true }
    );
    res.json({ message: 'Marked as viewed' });
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
    const reports = await MagistrateReport.find({
      submittedToChief: true,
      clerkCourt: { $regex: new RegExp(`^${court}$`, 'i') }
    })
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error("Error in chief/all route:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/chief/view/:id', verifyToken, verifyChief, async (req, res) => {
  try {
    await MagistrateReport.findByIdAndUpdate(
      req.params.id,
      { chiefViewed: true },
      { new: true }
    );
    res.json({ message: 'Marked as viewed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/magistrate-reports');
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

// Add these new routes
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

    // Verify report exists
    const report = await MagistrateReport.findById(reportId);
    if (!report) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Report not found' });
    }

    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
  url: `/uploads/magistrate-reports/${req.file.filename}` // Relative URL
   };

    const updatedReport = await MagistrateReport.findByIdAndUpdate(
      reportId,
      { $push: { attachments: fileData } },
      { new: true }
    );

    res.json({ file: fileData });
  } catch (err) {
    console.error('Upload error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'File upload failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.delete('/delete-file', verifyToken, async (req, res) => {
  try {
    const { url, reportId } = req.body;
    if (!url || !reportId) {
      return res.status(400).json({ error: 'URL and report ID are required' });
    }

    // Remove file from filesystem
    const filename = url.split('/').pop();
    const filePath = path.join(__dirname, '../uploads/magistrate-reports', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove file reference from report
    await MagistrateReport.findByIdAndUpdate(
      reportId,
      { $pull: { attachments: { url } } },
      { new: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;