const db = require("../config/db");
const { getSocket } = require("../socket");

exports.getAllComments = (req, res) => {
  const query = "SELECT * FROM comments";
  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error fetching all comments.", error });
    }
    res.json(results);
  });
};

exports.addComment = (req, res) => {
  const io = getSocket();
  const { content, postId, userId, username } = req.body;

  if (!content || !postId || !username) {
    return res.status(400).json({ message: "Content, post ID, and username are required." });
  }

  const sql = "INSERT INTO comments (content, postId, user_id, username) VALUES (?, ?, ?, ?)";
  db.query(sql, [content, postId, userId, username], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Error inserting comment." });
    }

    const newComment = { id: result.insertId, content, postId, userId: userId || null, username };

    db.query("SELECT user_id FROM posts WHERE id = ?", [postId], (err, rows) => {
      if (err) return res.status(500).json({ error: "Error getting post author." });

      if (rows.length > 0 && rows[0].user_id !== userId) {
        const postAuthorId = rows[0].user_id;
        const notificationMessage = `New comment on your post ${postId}: "${content}"`;

        db.query(
          "INSERT INTO notifications (userId, message, postId) VALUES (?, ?, ?)",
          [postAuthorId, notificationMessage, postId],
          (err) => {
            if (err) console.error("Error saving notification:", err);
          }
        );

        if (io) {
          io.to(`user_${postAuthorId}`).emit("new-comment", {
            postId,
            commentId: newComment.id,
            message: notificationMessage,
            content,
          });
        }
      }
      res.status(201).json(newComment);
    });
  });
};

exports.getCommentsByPostId = (req, res) => {
  const { postId } = req.params;

  const query = `
    SELECT comments.id, comments.content, comments.postId, comments.user_id, comments.created_at, posts.visibility 
    FROM comments 
    JOIN posts ON comments.postId = posts.id 
    WHERE comments.postId = ?
  `;
  db.query(query, [postId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error fetching comments.", error });
    }
    res.json(results);
  });
};

exports.updateComment = (req, res) => {
  const commentId = req.params.id;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Comment content is required." });
  }

  const sql = "UPDATE comments SET content = ? WHERE id = ?";
  db.query(sql, [content, commentId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const updatedComment = { id: commentId, content: content };
    return res.status(200).json(updatedComment);
  });
};

exports.deleteComment = (req, res) => {
  const commentId = req.params.id;

  const sqlCheck = "SELECT * FROM comments WHERE id = ?";
  db.query(sqlCheck, [commentId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching comment." });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const sqlDelete = "DELETE FROM comments WHERE id = ?";
    db.query(sqlDelete, [commentId], (err) => {
      if (err) {
        return res.status(500).json({ message: "Error deleting comment." });
      }
      res.json({ message: "Comment deleted successfully!" });
    });
  });
};

exports.getUserNotifications = (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM notifications WHERE userId = ?";
  db.query(sql, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error fetching notifications." });
    }
    res.status(200).json(results);
  });
};

exports.addNotification = (req, res) => {
  const { message, postId } = req.body;
  const userId = req.params.userId;
  const sql = "INSERT INTO notifications (userId, message, postId) VALUES (?, ?, ?)";
  db.query(sql, [userId, message, postId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error saving notification." });
    }
    res.status(201).json({ id: results.insertId, message, postId });
  });
};

exports.deleteNotification = (req, res) => {
  const notificationId = req.params.id;
  const sql = "DELETE FROM notifications WHERE id = ?";
  db.query(sql, [notificationId], (error, result) => {
    if (error) {
      return res.status(500).json({ message: "Error removing notification." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found." });
    }
    res.status(200).json({ message: "Notification removed successfully." });
  });
};
