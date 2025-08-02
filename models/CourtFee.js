const mongoose = require('mongoose');

const courtFeeSchema = new mongoose.Schema({
  term: { 
    type: String, 
    enum: ['February', 'May', 'August', 'November'],
    required: true
  },
  year: { type: String, required: true },
  judgeName: { type: String, required: true },
  court: { type: String, required: true },
  clerkCourt: { type: String, required: true },
  entries: [{
    payeeName: { type: String, required: true },
    amount: { type: Number, required: true },
    bankName: { type: String, required: true },
    receiptNumber: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['Fine', 'Fee', 'Cost'],
      required: true
    },
    date: { type: Date, required: true }
  }],
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
  attachments: [{
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
});

courtFeeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CourtFee', courtFeeSchema);