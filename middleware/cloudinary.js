const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const path = require('path');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Supported file extensions
    const supportedFormats = [
      '.jpg', '.jpeg', '.png', 
      '.pdf', 
      '.doc', '.docx', 
      '.xls', '.xlsx', 
      '.ppt', '.pptx',
      '.csv', '.txt'
    ];

    if (!supportedFormats.includes(ext)) {
      throw new Error('Unsupported file format');
    }

    return {
      folder: 'ecms-files',
      resource_type: 'auto', // Let Cloudinary automatically detect the type
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt'],
      format: ext.replace('.', ''), // Preserve original format
    };
  },
});
const upload = multer({ storage });

module.exports = upload;
