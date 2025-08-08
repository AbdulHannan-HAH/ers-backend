const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const path = require('path'); // 👈 Add this at the top

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    return {
      folder: 'ecms-files',
      resource_type: 'auto', // 👈 Let Cloudinary detect the type
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
      format: async (req, file) => {
        // Extract extension and map to Cloudinary's expected format
        const ext = path.extname(file.originalname).substring(1);
        return ext;
      },
    };
  },
});
const upload = multer({ storage });

module.exports = upload;
