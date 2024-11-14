const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const passport = require("passport");

exports.register = (req, res) => {
  const { email, password, username, role = "user" } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.query(
      "INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, username, role],
      (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error creating user", error: err });
        }
        res.status(201).json({ message: "User created successfully" });
      }
    );
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res
        .status(401)
        .json({ accessToken: null, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: 86400 }
    );

    res.status(200).json({
      accessToken: token,
      username: user.username || "User",
      email: user.email,
      userId: user.id,
      profilePicture: user.profilePicture || null,
      userRole: user.role,
    });
  });
};

exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

exports.googleCallback = (req, res) => {
  const user = req.user;
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  const frontendUrl = `http://localhost:4200/blog?token=${token}&accessToken=${token}&userId=${user.id}&email=${user.email}&username=${user.username}&profilePicture=${user.profilePicture}&userRole=${user.role}`;

  res.redirect(frontendUrl);
};
