const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");

router.get("/all", categoryController.getAllCategories);
router.get("/", categoryController.getCategoriesByPostId);
router.get('/post/:postId', categoryController.getCategoriesByPostId);
router.post("/", categoryController.createCategory);
router.put("/:id", categoryController.updateCategory);
router.delete('/:postId/categories/:categoryId', categoryController.deleteCategoryFromPost);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
