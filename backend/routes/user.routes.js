const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const upload = require('../middlewares/upload.middleware');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', userController.getAllUsers);
router.put('/update/:id', verifyToken, upload.single('profilePicture'), userController.updateUser);
router.put('/admin/update/:id', verifyToken, upload.single('profilePicture'), userController.updateUserAdmin);
router.get('/users/:id', verifyToken, userController.getUserById);
router.delete('/users/:id', verifyToken, userController.deleteUser);

module.exports = router;
