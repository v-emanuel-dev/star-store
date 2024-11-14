const bcrypt = require("bcrypt");
const db = require("../config/db");

exports.getAllUsers = (req, res) => {
  const query = "SELECT id, username, email, role, profilePicture FROM users";

  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Internal server error." });
    }

    res.status(200).json(results);
  });
};

exports.updateUser = (req, res) => {
  const { username, email, password } = req.body;
  const userId = req.userId;
  const profilePicture = req.file ? req.file.path : null;

  let updateQuery = "UPDATE users SET username = ?, email = ?";
  const queryParams = [username, email];

  if (profilePicture) {
    updateQuery += ", profilePicture = ?";
    queryParams.push(profilePicture);
  }

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    updateQuery += ", password = ?";
    queryParams.push(hashedPassword);
  }

  updateQuery += " WHERE id = ?";
  queryParams.push(userId);

  db.query(updateQuery, queryParams, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User information updated successfully",
      profilePicture: profilePicture
        ? `http://localhost:3000/${profilePicture}`
        : null,
    });
  });
};

exports.updateUserAdmin = (req, res) => {
  const { username, email, password, role } = req.body;
  const { id } = req.params;
  const profilePicture = req.file ? req.file.path : null;

  let updateQuery = "UPDATE users SET username = ?, email = ?";
  const queryParams = [username, email];

  if (role) {
    updateQuery += ", role = ?";
    queryParams.push(role);
  }

  if (profilePicture) {
    updateQuery += ", profilePicture = ?";
    queryParams.push(profilePicture);
  }

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    updateQuery += ", password = ?";
    queryParams.push(hashedPassword);
  }

  updateQuery += " WHERE id = ?";
  queryParams.push(id);

  db.query(updateQuery, queryParams, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User information updated successfully" });
  });
};

exports.getUserById = (req, res) => {
  const userId = req.params.id;

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  const query =
    "SELECT id, username, email, profilePicture FROM users WHERE id = ?";
  db.query(query, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Internal server error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = results[0];

    if (user.profilePicture) {
      if (
        user.profilePicture.startsWith("http://") ||
        user.profilePicture.startsWith("https://")
      ) {
        user.profilePicture = user.profilePicture;
      } else {
        user.profilePicture = `http://localhost:3000/${user.profilePicture.replace(
          /\\/g,
          "/"
        )}`;
      }
    }

    res.status(200).json(user);
  });
};

exports.deleteUser = (req, res) => {
  const userId = req.params.id;

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID format." });
  }

  db.query("SET FOREIGN_KEY_CHECKS = 0", (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error disabling foreign key checks", error: err });
    }

    const deleteLikesQuery = "DELETE FROM likes WHERE user_id = ?";
    db.query(deleteLikesQuery, [userId], (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({
            message: "Database error during likes deletion",
            error: err,
          });
      }

      const deleteCommentsQuery = "DELETE FROM comments WHERE user_id = ?";
      db.query(deleteCommentsQuery, [userId], (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({
              message: "Database error during comments deletion",
              error: err,
            });
        }

        const deletePostsQuery = "DELETE FROM posts WHERE user_id = ?";
        db.query(deletePostsQuery, [userId], (err, results) => {
          if (err) {
            return res
              .status(500)
              .json({
                message: "Database error during posts deletion",
                error: err,
              });
          }

          const deleteUserQuery = "DELETE FROM users WHERE id = ?";
          db.query(deleteUserQuery, [userId], (err, results) => {
            if (err) {
              return res
                .status(500)
                .json({ message: "Database error", error: err });
            }

            if (results.affectedRows === 0) {
              return res.status(404).json({ message: "User not found" });
            }

            db.query("SET FOREIGN_KEY_CHECKS = 1", (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({
                    message: "Error re-enabling foreign key checks",
                    error: err,
                  });
              }

              res
                .status(200)
                .json({
                  message: "User and related data deleted successfully",
                });
            });
          });
        });
      });
    });
  });
};
