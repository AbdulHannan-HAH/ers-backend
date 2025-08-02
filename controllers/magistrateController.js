const MagistrateReport = require('../models/MagistrateReport');

exports.createMagistrateReport = async (req, res) => {
  try {
    const report = new MagistrateReport({
      userId: req.user.userId,
      ...req.body,
      submittedToAdmin: true
    });
    await report.save();
    res.status(201).json(report);
  } catch(e) { res.status(500).json({ msg:'Server error', error: e.message }); }
};

exports.getMyMagistrateReports = async (req, res) => {
  const reports = await MagistrateReport.find({ userId: req.user.userId }).sort({ createdAt:-1 });
  res.json(reports);
};

exports.getAllMagistrateReports = async (req, res) => {
  const all = await MagistrateReport.find()
    .populate('userId', 'username circuitCourt')
    .sort({ createdAt:-1 });
  res.json(all);
};

exports.markMagistrateViewed = async (req, res) => {
  const updated = await MagistrateReport.findByIdAndUpdate(
    req.params.id, { adminViewed: true }, { new:true }
  );
  res.json(updated);
};
