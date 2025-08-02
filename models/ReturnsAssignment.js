const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseType: { 
    type: String, 
    enum: ['Criminal', 'Civil'], 
    default: 'Criminal',
    required: true
  },
  caseTitle: {
    type: String,
    required: true
  },
  crimeOrAction: {
    type: String,
    required: true
  },
  disposition: String,
  juryInfo: String,
  costFineAmount: String,
  remarks: String
}, { _id: false });

const returnsAssignmentSchema = new mongoose.Schema({
  term: { 
    type: String, 
    enum: ['February Term', 'May Term', 'August Term', 'November Term'],
    required: true
  },
  year: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v);
      },
      message: props => `${props.value} is not a valid year!`
    }
  },
  judgeName: {
    type: String,
    required: true
  },
  circuitCourt: { 
    type: String, 
    required: true
  },
  submittedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  cases: [caseSchema],
  finalized: { 
    type: Boolean, 
    default: false 
  },
  submittedToAdmin: { type: Boolean, default: false },
  submittedToChief: { type: Boolean, default: false },
  adminViewed: { type: Boolean, default: false },
  chiefViewed: { type: Boolean, default: false },
  rejected: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' },
  removedByClerk: { type: Boolean, default: false },
  attachments: [{
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
returnsAssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ReturnsAssignment', returnsAssignmentSchema);