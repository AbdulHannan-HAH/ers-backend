// routes/authRoutes.js

const express = require('express');
const router = express.Router(); // Create a router object
const { loginUser, createUser } = require('../controllers/authController'); // Import controller functions
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware'); // Import middlewares
const { getAllUsers } = require('../controllers/authController');
const { updateUser, deleteUser } = require('../controllers/authController');


router.get('/users', verifyToken, verifyAdmin, getAllUsers);


// POST /api/auth/login ➝ login for all users
router.post('/login', loginUser);

// POST /api/auth/create ➝ only admin can create new users
router.post('/create', verifyToken, verifyAdmin, createUser);


router.delete('/user/:id', verifyToken, verifyAdmin, deleteUser);
router.put('/user/:id', verifyToken, verifyAdmin, updateUser);

module.exports = router; // Export router
