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


// Add this near the top with other requires
const cloudinary = require('cloudinary').v2;
const upload = require('../middleware/cloudinary');

// Update the file upload route
router.post('/upload', verifyToken, (req, res, next) => {
  console.log('Upload request received'); // Log 1
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('1. Upload middleware error:', err); // Log 2
      return res.status(400).json({ 
        error: err.message.includes('Invalid file type') 
          ? 'Unsupported file format' 
          : 'File upload failed'
      });
    }

    try {
      console.log('2. File received:', req.file); // Log 3
      
      if (!req.file) {
        console.log('3. No file in request'); // Log 4
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const docketId = req.body.docketId;
      console.log('4. Docket ID:', docketId); // Log 5
      
      if (!docketId) {
        console.log('5. Missing docket ID'); // Log 6
        if (req.file.public_id) {
          await cloudinary.uploader.destroy(req.file.public_id);
        }
        return res.status(400).json({ error: 'Docket ID required' });
      }

      const fileData = {
        filename: req.file.originalname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: req.file.secure_url,
        public_id: req.file.public_id
      };
      console.log('6. File data prepared:', fileData); // Log 7

      const updated = await ReturnAssignment.findByIdAndUpdate(
        docketId,
        { $push: { attachments: fileData } },
        { new: true }
      );
      console.log('7. Database updated:', updated); // Log 8

      res.json({ 
        success: true,
        file: fileData 
      });
    } catch (err) {
      console.error('8. Processing error:', err); // Log 9
      if (req.file?.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      res.status(500).json({ 
        error: 'File processing failed',
        details: err.message 
      });
    }
  });
});
// Ensure the delete route matches
router.delete('/delete-file', verifyToken, async (req, res) => {
  try {
    const { url, docketId } = req.body;
    if (!url || !docketId) {
      return res.status(400).json({ error: 'URL and docket ID are required' });
    }

    // Extract public_id from Cloudinary URL
    const parts = url.split('/');
    const fileWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${fileWithExt.split('.')[0]}`;

    // Delete file from Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    // Remove file reference from MongoDB
    await ReturnAssignment.findByIdAndUpdate(
      docketId,
      { $pull: { attachments: { url } } },
      { new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
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