const db = require('../config/db');

const User = {
  findByEmail: (email, callback) => {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  },

  create: ({ email, username, password, profilePicture }, callback) => {
    const query = 'INSERT INTO users (email, username, password, profilePicture) VALUES (?, ?, ?, ?)';
    db.query(query, [email, username, password, profilePicture], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, { id: results.insertId, email, username, profilePicture });
    });
  },

  findById: (id, callback) => {
    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  },
};

module.exports = User;
