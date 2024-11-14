const db = require("../config/db");

const Post = {
  create: (newPost, callback) => {
    const query = "INSERT INTO posts (title, content) VALUES (?, ?)";
    db.query(query, [newPost.title, newPost.content], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, { id: result.insertId, ...newPost });
    });
  },

  update: (id, updatedPost, callback) => {
    const query = "UPDATE posts SET title = ?, content = ? WHERE id = ?";
    db.query(
      query,
      [updatedPost.title, updatedPost.content, id],
      (err, result) => {
        if (err) {
          return callback(err, null);
        }
        if (result.affectedRows === 0) {
          return callback(null, { message: "Post not found" });
        }
        callback(null, { id, ...updatedPost });
      }
    );
  },

  findById: (id, callback) => {
    const query = "SELECT * FROM posts WHERE id = ?";
    db.query(query, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      if (results.length > 0) {
        callback(null, results[0]);
      } else {
        callback(null, null);
      }
    });
  },
};

module.exports = Post;
