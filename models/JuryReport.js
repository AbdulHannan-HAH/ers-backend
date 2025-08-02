const mongoose = require('mongoose');

const jurorSchema = new mongoose.Schema({
  jurorName: { type: String, required: true },
  contactNo: { type: String, required: true },
  daysAttended: { type: Number, required: true },
  amountPerDay: { type: Number, required: true },
  jurorId: { type: String, required: true },
  jurorType: { type: String, enum: ['Regular', 'Alternative'], default: 'Regular' }
}, { _id: false });

const caseSchema = new mongoose.Schema({
  caseCaption: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  jurors: [jurorSchema]
}, { _id: false });

const juryReportSchema = new mongoose.Schema({
  term: { 
    type: String, 
    enum: ['February', 'May', 'August', 'November'],
    required: true
  },
  year: { type: String, required: true },
  judgeName: { type: String, required: true },
  juryType: { 
    type: String, 
    enum: ['Grand Jury', 'Petit Jury'],
    required: true 
  },
  clerkCourt: { type: String, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cases: [caseSchema],
  finalized: { type: Boolean, default: false },
  submittedToAdmin: { type: Boolean, default: false },
  submittedToChief: { type: Boolean, default: false },
  adminViewed: { type: Boolean, default: false },
  chiefViewed: { type: Boolean, default: false },
  rejected: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  attachments: [{
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
});

juryReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('JuryReport', juryReportSchema);