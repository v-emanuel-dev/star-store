const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.log("No token provided, proceeding as guest");
    req.userId = null;
    req.userRole = 'guest';
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Failed to authenticate token:", err);

      // Se o erro for de token expirado, você pode retornar 401 ou 403
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired, please log in again.' });
      }

      return res.status(403).json({ message: 'Failed to authenticate token.' });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

