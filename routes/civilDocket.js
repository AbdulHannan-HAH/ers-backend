const express = require('express');
const router = express.Router();
const CivilDocket = require('../models/CivilDocket');
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
    if (user.role !== 'Circuit Clerk') return res.status(403).json({ error: 'Only clerks can create dockets' });

    const docket = new CivilDocket({
      ...req.body,
      court: user.circuitCourt,
      submittedBy: req.user.userId
    });

    await docket.save();
    res.status(201).json(docket);
  } catch (err) {
    console.error("Error creating docket:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', verifyToken, async (req, res) => {
  try {
    const dockets = await CivilDocket.find({ submittedBy: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(dockets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const docket = await CivilDocket.findById(req.params.id);
    res.json(docket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updated = await CivilDocket.findByIdAndUpdate(
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

    const updated = await CivilDocket.findByIdAndUpdate(
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
    const updated = await CivilDocket.findByIdAndUpdate(
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
    const updated = await CivilDocket.findByIdAndUpdate(
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
    const updated = await CivilDocket.findByIdAndUpdate(
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
    const dockets = await CivilDocket.find({
      submittedToAdmin: true,
      court: { $regex: new RegExp(`^${court}$`, 'i') }
    })
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(dockets);
  } catch (err) {
    console.error("Error in admin/all route:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/view/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await CivilDocket.findByIdAndUpdate(
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
    const dockets = await CivilDocket.find({
      submittedToChief: true,
      court: { $regex: new RegExp(`^${court}$`, 'i') }
    })
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(dockets);
  } catch (err) {
    console.error("Error in chief/all route:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/chief/view/:id', verifyToken, verifyChief, async (req, res) => {
  try {
    await CivilDocket.findByIdAndUpdate(
      req.params.id,
      { chiefViewed: true },
      { new: true }
    );
    res.json({ message: 'Marked as viewed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this route to your civil-dockets routes
router.patch('/remove/:id', verifyToken, async (req, res) => {
  try {
    const updated = await CivilDocket.findByIdAndUpdate(
      req.params.id,
      { removedByClerk: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/civil-dockets');
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

const upload = require('../middleware/cloudinary'); // 👈 use your Cloudinary upload middleware

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const docketId = req.body.docketId;
    if (!req.file || !docketId) {
      return res.status(400).json({ error: 'File and Docket ID required' });
    }

    const docket = await CivilDocket.findById(docketId);
    if (!docket) {
      return res.status(404).json({ error: 'Docket not found' });
    }

    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: req.file.path, // 👈 this is the cloudinary secure URL
    };

    const updated = await CivilDocket.findByIdAndUpdate(
      docketId,
      { $push: { attachments: fileData } },
      { new: true }
    );

    res.json({ file: fileData });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
});


router.delete('/delete-file', verifyToken, async (req, res) => {
  try {
    const { url, docketId } = req.body;
    if (!url || !docketId) {
      return res.status(400).json({ error: 'URL and docket ID are required' });
    }

    // Remove file from filesystem
    const filename = url.split('/').pop();
    const filePath = path.join(__dirname, '../uploads/civil-dockets', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove file reference from docket
    await CivilDocket.findByIdAndUpdate(
      docketId,
      { $pull: { attachments: { url } } },
      { new: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;