const db = require("../config/db");

exports.getPostsAdmin = (req, res) => {
  const userRole = req.userRole;

  if (userRole !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const query = `
  SELECT 
    posts.*, 
    users.username, 
    comments.id AS comment_id, 
    comments.content AS comment_content, 
    categories.name AS category_name,
    (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes
  FROM posts 
  JOIN users ON posts.user_id = users.id
  LEFT JOIN comments ON comments.postId = posts.id
  LEFT JOIN post_categories ON posts.id = post_categories.postId
  LEFT JOIN categories ON post_categories.categoryId = categories.id
`;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const postsWithDetails = results.reduce((acc, post) => {
      const {
        id,
        title,
        content,
        username,
        comment_id,
        comment_content,
        category_name,
      } = post;

      let existingPost = acc.find((p) => p.id === id);

      if (existingPost) {
        if (comment_content) {
          existingPost.comments.push({
            id: comment_id,
            content: comment_content,
          });
        }
      } else {
        existingPost = {
          id,
          title,
          content,
          username,
          comments: comment_content
            ? [{ id: comment_id, content: comment_content }]
            : [],
          category: category_name || null,
          created_at: post.created_at,
          visibility: post.visibility,
          likes: post.likes || 0,
        };
        acc.push(existingPost);
      }
      return acc;
    }, []);

    res.json(postsWithDetails);
  });
};

exports.getAllPosts = (req, res) => {
  const userId = req.userId;

  const query = `
  SELECT 
    posts.*, 
    users.username, 
    comments.id AS comment_id, 
    comments.content AS comment_content, 
    categories.name AS category_name,
    (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes
  FROM posts 
  JOIN users ON posts.user_id = users.id
  LEFT JOIN comments ON comments.postId = posts.id
  LEFT JOIN post_categories ON posts.id = post_categories.postId
  LEFT JOIN categories ON post_categories.categoryId = categories.id
  WHERE posts.visibility = 'public' 
    OR (posts.visibility = 'private' AND posts.user_id = ?)
  `;

  const params = [userId];

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const postsWithDetails = results.reduce((acc, post) => {
      const {
        id,
        title,
        content,
        username,
        comment_id,
        comment_content,
        category_name,
      } = post;

      let existingPost = acc.find((p) => p.id === id);

      if (existingPost) {
        if (comment_content) {
          existingPost.comments.push({
            id: comment_id,
            content: comment_content,
          });
        }
      } else {
        existingPost = {
          id,
          title,
          content,
          username,
          comments: comment_content
            ? [{ id: comment_id, content: comment_content }]
            : [],
          category: category_name || null,
          created_at: post.created_at,
          visibility: post.visibility,
          likes: post.likes || 0,
        };
        acc.push(existingPost);
      }
      return acc;
    }, []);

    res.json(postsWithDetails);
  });
};

exports.getPostById = (req, res) => {
  const postId = req.params.id;

  const query = `
    SELECT 
      posts.*, 
      categories.name AS category_name,
      COUNT(likes.id) AS likes
    FROM posts 
    LEFT JOIN post_categories ON posts.id = post_categories.postId 
    LEFT JOIN categories ON post_categories.categoryId = categories.id 
    LEFT JOIN likes ON likes.post_id = posts.id 
    WHERE posts.id = ?
    GROUP BY posts.id, categories.name
  `;

  db.query(query, [postId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Post not found." });
    }

    const post = {
      ...results[0],
      categories: results.map((row) => row.category_name).filter(Boolean),
      likes: results[0].likes || 0,
    };

    res.status(200).json(post);
  });
};

exports.createPost = (req, res) => {
  const { title, content, user_id, visibility, categoryIds } = req.body;

  if (
    !title ||
    !content ||
    !user_id ||
    !categoryIds ||
    categoryIds.length === 0
  ) {
    return res.status(400).json({
      message:
        "Title, content, user ID, and at least one category are required.",
    });
  }

  const query =
    "INSERT INTO posts (title, content, user_id, visibility) VALUES (?, ?, ?, ?)";
  const values = [title, content, user_id, visibility];

  db.query(query, values, (error, result) => {
    if (error) {
      return res.status(500).json({ message: "Error creating post" });
    }

    const postId = result.insertId;

    const categoryQueries = categoryIds.map((categoryId) => {
      return new Promise((resolve, reject) => {
        const categoryQuery =
          "INSERT INTO post_categories (postId, categoryId) VALUES (?, ?)";
        db.query(categoryQuery, [postId, categoryId], (error) => {
          if (error) {
            reject(new Error("Error associating category"));
          } else {
            resolve();
          }
        });
      });
    });

    Promise.all(categoryQueries)
      .then(() => {
        return res
          .status(201)
          .json({ message: "Post created successfully", postId });
      })
      .catch((error) => {
        return res
          .status(500)
          .json({ message: "Error associating categories" });
      });
  });
};

exports.updatePost = (req, res) => {
  const { title, content, visibility, categoryIds } = req.body;
  const postId = req.params.id;

  db.query(
    "SELECT user_id FROM posts WHERE id = ?",
    [postId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const isOwner = results.length > 0 && results[0].user_id === req.userId;
      const isAdmin = req.userRole === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      db.query(
        "UPDATE posts SET title = ?, content = ?, visibility = ? WHERE id = ?",
        [title, content, visibility, postId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          db.query(
            "DELETE FROM post_categories WHERE postId = ?",
            [postId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              if (categoryIds && categoryIds.length > 0) {
                const values = categoryIds.map((categoryId) => [
                  postId,
                  categoryId,
                ]);
                db.query(
                  "INSERT INTO post_categories (postId, categoryId) VALUES ?",
                  [values],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }
                    res.status(204).send();
                  }
                );
              } else {
                res.status(204).send();
              }
            }
          );
        }
      );
    }
  );
};

exports.deletePost = (req, res) => {
  const postId = req.params.id;

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const deleteLikesQuery = "DELETE FROM likes WHERE post_id = ?";
    db.query(deleteLikesQuery, [postId], (err) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ error: "Failed to remove likes." });
        });
      }

      const deleteReferencesQuery =
        "DELETE FROM post_categories WHERE postId = ?";
      db.query(deleteReferencesQuery, [postId], (err) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: "Failed to remove references." });
          });
        }

        const deletePostQuery = "DELETE FROM posts WHERE id = ?";
        db.query(deletePostQuery, [postId], (err, results) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          }

          if (results.affectedRows === 0) {
            return db.rollback(() => {
              res.status(404).json({ error: "Post not found." });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }
            res.status(204).send();
          });
        });
      });
    });
  });
};

exports.toggleLike = (req, res) => {
  const postId = req.params.id;
  const userId = req.userId;

  const queryCheckPost = `SELECT * FROM posts WHERE id = ?`;
  db.query(queryCheckPost, [postId], (err, results) => {
    if (err) {
      console.error("Erro ao verificar o post:", err);
      return res.status(500).json({ message: "Erro ao verificar o post" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Post não encontrado" });
    }

    const queryCheckLike = `SELECT * FROM likes WHERE user_id = ? AND post_id = ?`;
    db.query(queryCheckLike, [userId, postId], (err, likeResults) => {
      if (err) {
        console.error("Erro ao verificar like:", err);
        return res.status(500).json({ message: "Erro ao verificar like" });
      }

      if (likeResults.length > 0) {
        const queryDeleteLike = `DELETE FROM likes WHERE user_id = ? AND post_id = ?`;
        db.query(queryDeleteLike, [userId, postId], (err) => {
          if (err) {
            console.error("Erro ao remover like:", err);
            return res.status(500).json({ message: "Erro ao remover like" });
          }

          const queryCountLikes = `SELECT COUNT(*) AS totalLikes FROM likes WHERE post_id = ?`;
          db.query(queryCountLikes, [postId], (err, countResults) => {
            if (err) {
              console.error("Erro ao contar likes:", err);
              return res.status(500).json({ message: "Erro ao contar likes" });
            }

            res.status(200).json({
              message: "Like removido com sucesso",
              likeCount: countResults[0].totalLikes,
            });
          });
        });
      } else {
        const queryInsertLike = `INSERT INTO likes (user_id, post_id) VALUES (?, ?)`;
        db.query(queryInsertLike, [userId, postId], (err) => {
          if (err) {
            console.error("Erro ao adicionar like:", err);
            return res.status(500).json({ message: "Erro ao adicionar like" });
          }

          const queryCountLikes = `SELECT COUNT(*) AS totalLikes FROM likes WHERE post_id = ?`;
          db.query(queryCountLikes, [postId], (err, countResults) => {
            if (err) {
              console.error("Erro ao contar likes:", err);
              return res.status(500).json({ message: "Erro ao contar likes" });
            }

            res.status(200).json({
              message: "Like adicionado com sucesso",
              likeCount: countResults[0].totalLikes,
            });
          });
        });
      }
    });
  });
};
