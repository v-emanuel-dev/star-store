const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");

router.get("/", commentController.getAllComments);
router.get("/post/:postId", commentController.getCommentsByPostId);
router.get("/:userId/notifications", commentController.getUserNotifications);
router.post("/:userId/notifications", commentController.addNotification);
router.post("/", commentController.addComment);
router.put("/:id", commentController.updateComment);
router.delete("/notifications/:id", commentController.deleteNotification);
router.delete("/:id", commentController.deleteComment);

module.exports = router;
