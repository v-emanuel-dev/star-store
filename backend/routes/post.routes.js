const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Rota para criar um post com upload de imagem
router.post('/', authMiddleware.verifyToken, upload.single('profilePicture'), postController.createPost);
router.get('/', authMiddleware.verifyToken, postController.getAllPosts);
router.get('/admin', authMiddleware.verifyToken, postController.getPostsAdmin); 
router.get('/:id', authMiddleware.verifyToken, postController.getPostById);
router.put('/:id', authMiddleware.verifyToken, upload.single('profilePicture'), postController.updatePost);
router.delete('/:id', authMiddleware.verifyToken, postController.deletePost);
router.post('/:id/like', authMiddleware.verifyToken, postController.toggleLike);

module.exports = router;
