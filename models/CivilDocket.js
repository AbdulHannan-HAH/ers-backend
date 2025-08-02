const mongoose = require('mongoose');

const civilCaseSchema = new mongoose.Schema({
  plaintiff: { type: String, required: true },
  defendant: { type: String, required: true },
  action: { type: String, required: true }, // Changed from crime to action
  dateFiled: { type: Date, required: true },
  caseNumber: { type: String },
  amountDeposited: { type: Number, default: 0 }
}, { _id: false });

const civilDocketSchema = new mongoose.Schema({
  term: { 
    type: String, 
    enum: ['February', 'May', 'August', 'November'],
    required: true
  },
  year: { type: String, required: true },
  judgeName: { type: String, required: true },
  clerkName: { type: String, required: true },
  court: { type: String, required: true },
  cases: [civilCaseSchema],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  finalized: { type: Boolean, default: false },
  submittedToAdmin: { type: Boolean, default: false },
  submittedToChief: { type: Boolean, default: false },
  adminViewed: { type: Boolean, default: false },
  chiefViewed: { type: Boolean, default: false },
  rejected: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' },

attachments: [{
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  removedByClerk: {
    type: Boolean,
    default: false
  }
});

civilDocketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CivilDocket', civilDocketSchema);