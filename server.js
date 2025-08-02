const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs'); // Add this line to import fs module

dotenv.config();

// Routes
const authRoutes = require('./routes/authRoutes');
const returnsRoutes = require('./routes/returnsRoutes');
const magistrateRoutes = require('./routes/magistrateReports');
const juryRoutes = require('./routes/juryReports');
const courtRoutes = require("./routes/courtRoutes");
const criminalDocketRoutes = require('./routes/criminalDocket');
const courtFeeRoutes = require('./routes/courtFees');
const civilDocketRoutes = require('./routes/civilDocket');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads'); // ← Add ../
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });

}
const juryReportsDir = path.join(uploadDir, 'jury-reports');
if (!fs.existsSync(juryReportsDir)) {
  fs.mkdirSync(juryReportsDir, { recursive: true });
}

const feeReportsDir = path.join(uploadDir, 'fee-reports');
if (!fs.existsSync(feeReportsDir)) {
  fs.mkdirSync(feeReportsDir, { recursive: true });
}

const returnsReportsDir = path.join(uploadDir, 'returns-assignments');
if (!fs.existsSync(returnsReportsDir)) {
  fs.mkdirSync(returnsReportsDir, { recursive: true });
}

// Serve static files - add this specific route FIRST
app.use('/uploads/jury-reports', express.static(juryReportsDir));
app.use('/uploads/fee-reports', express.static(feeReportsDir));

app.use('/uploads/returns-assignments', express.static(returnsReportsDir));

app.use('/uploads/magistrate-reports', express.static(path.join(uploadDir, 'magistrate-reports')));

// Route setup
app.use('/api/auth', authRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/magistrate-reports', magistrateRoutes);
app.use('/api/jury-reports', juryRoutes);
app.use("/api/courts", courtRoutes);
app.use('/api/criminal-dockets', criminalDocketRoutes);
app.use('/api/civil-dockets', civilDocketRoutes);
app.use('/api/court-fees', courtFeeRoutes);
app.use('/uploads', express.static(uploadDir));
// Add this line with the other static file serving

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
.catch((err) => console.error('❌ MongoDB connection error:', err));