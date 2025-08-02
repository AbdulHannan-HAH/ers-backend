const JuryForm = require('../models/JuryForm');


// @desc Submit jury payroll form
// @route POST /api/forms/jury
// @access Clerk only
const submitJuryForm = async (req, res) => {
  try {
    const {
      juryType,
      judge,
      term,
      dateFrom,
      dateTo,
      jurors
    } = req.body;

    const newForm = new JuryForm({
      juryType,
      judge,
      term,
      dateFrom: juryType === 'Petit Jury' ? dateFrom : null,
      dateTo: juryType === 'Petit Jury' ? dateTo : null,
      jurors,
      submittedBy: req.user.userId // coming from token
    });

    await newForm.save();

    res.status(201).json({ msg: 'Jury form submitted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to submit form', error: err.message });
  }
};
// GET all forms submitted by user (clerk)
const getAllForms = async (req, res) => {
  try {
    const forms = await JuryForm.find({ submittedBy: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(forms);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch forms" });
  }
};

module.exports = {
  submitJuryForm,
  getAllForms,
};

module.exports = { submitJuryForm };
