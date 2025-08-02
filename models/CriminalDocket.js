const mongoose = require('mongoose');

const criminalCaseSchema = new mongoose.Schema({
  plaintiff: { type: String, required: true },
  defendant: { type: String, required: true },
  crime: { type: String, required: true },
  dateFiled: { type: Date, required: true },
  caseNumber: { type: String },
  amountDeposited: { type: Number, default: 0 }
}, { _id: false });

const criminalDocketSchema = new mongoose.Schema({
  term: { 
    type: String, 
    enum: ['February', 'May', 'August', 'November'],
    required: true
  },
  year: { type: String, required: true },
  judgeName: { type: String, required: true },
  clerkName: { type: String, required: true },
  court: { type: String, required: true },
  cases: [criminalCaseSchema],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  finalized: { type: Boolean, default: false },
  submittedToAdmin: { type: Boolean, default: false },
  submittedToChief: { type: Boolean, default: false },
  adminViewed: { type: Boolean, default: false },
  chiefViewed: { type: Boolean, default: false },
  rejected: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  removedByClerk: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
});

criminalDocketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CriminalDocket', criminalDocketSchema);