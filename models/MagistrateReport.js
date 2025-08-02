const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  payeeName: { type: String, required: true },
  amountDeposited: { type: Number, required: true },
  bankName: { type: String, required: true },
  bankSlipNo: { type: String, required: true },
  cbaNo: { type: String, required: true },
  currency: { type: String, enum: ['USD', 'LRD'], required: true },
  court: { type: String, required: true }
}, { _id: false });

const magistrateReportSchema = new mongoose.Schema({
  term: { 
    type: String, 
    enum: ['February Term', 'May Term', 'August Term', 'November Term'],
    required: true
  },
  year: { type: String, required: true },
  magistrateName: { type: String, required: true },
  magisterialCourt: { type: String, required: true },
  clerkCourt: { type: String, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deposits: [depositSchema],
  finalized: { type: Boolean, default: false },
  submittedToAdmin: { type: Boolean, default: false },
  submittedToChief: { type: Boolean, default: false },
  adminViewed: { type: Boolean, default: false },
  chiefViewed: { type: Boolean, default: false },
  rejected: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },// Add this to the magistrateReportSchema
attachments: [{
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  url: String,
  uploadedAt: { type: Date, default: Date.now }
}]
});

magistrateReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MagistrateReport', magistrateReportSchema);