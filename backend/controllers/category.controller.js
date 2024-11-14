const db = require("../config/db");

exports.getAllCategories = (req, res) => {
  const sql = "SELECT * FROM categories";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
};

exports.getCategoriesByPostId = (req, res) => {
  const postId = Number(req.params.postId || req.query.postId);

  if (isNaN(postId)) {
    return res.status(400).json({ error: "postId must be a number" });
  }

  const query = `
    SELECT c.* 
    FROM categories c 
    WHERE c.id IN (
      SELECT pc.categoryId 
      FROM post_categories pc 
      WHERE pc.postId = ? 
    );
  `;

  db.query(query, [postId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
};

exports.createCategory = (req, res) => {
  const { name, postId } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  const query = "INSERT INTO categories (name) VALUES (?)";
  const params = [name];

  db.query(query, params, (error, results) => {
    if (error) {
      return res
        .status(500)
        .json({ message: "Database connection failed", error: error.message });
    }

    const categoryId = results.insertId;

    if (postId) {
      const associationQuery =
        "INSERT INTO post_categories (postId, categoryId) VALUES (?, ?)";
      db.query(associationQuery, [postId, categoryId], (assocError) => {
        if (assocError) {
          return res
            .status(500)
            .json({
              message: "Failed to associate category",
              error: assocError.message,
            });
        }
        res.status(201).json({
          message: "Category created successfully",
          categoryId: categoryId,
        });
      });
    } else {
      res.status(201).json({
        message: "Category created successfully",
        categoryId: categoryId,
      });
    }
  });
};

exports.updateCategory = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  const checkQuery = "SELECT * FROM categories WHERE id = ?";
  db.query(checkQuery, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    const updateQuery = "UPDATE categories SET name = ? WHERE id = ?";
    db.query(updateQuery, [name, id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(204).send();
    });
  });
};

exports.deleteCategoryFromPost = (req, res) => {
  const { postId, categoryId } = req.params;

  const checkQuery =
    "SELECT * FROM post_categories WHERE postId = ? AND categoryId = ?";
  db.query(checkQuery, [postId, categoryId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Association not found." });
    }

    const deleteQuery =
      "DELETE FROM post_categories WHERE postId = ? AND categoryId = ?";
    db.query(deleteQuery, [postId, categoryId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(204).send();
    });
  });
};

exports.deleteCategory = (req, res) => {
  const { id } = req.params;

  const deleteAssociationsQuery =
    "DELETE FROM post_categories WHERE categoryId = ?";
  const deleteCategoryQuery = "DELETE FROM categories WHERE id = ?";

  db.query(deleteAssociationsQuery, [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.query(deleteCategoryQuery, [id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(204).send();
    });
  });
};
