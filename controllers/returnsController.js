const ReturnsAssignment = require('../models/ReturnsAssignment');

exports.submitTo = async (req, res) => {
  const { id } = req.params;
  const { recipient } = req.body;

  if (!['admin', 'chief'].includes(recipient)) {
    return res.status(400).json({ msg: 'Invalid recipient' });
  }

  try {
    const report = await ReturnsAssignment.findById(id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Ensure it's finalized
    if (!report.finalized) {
      return res.status(400).json({ msg: 'Report must be finalized before submission' });
    }

    report.submittedTo = recipient;
    await report.save();

    res.json({ msg: `Report submitted to ${recipient}` });
  } catch (err) {
    console.error('❌ Error in submitTo:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
