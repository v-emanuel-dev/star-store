const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Obtém o token do cabeçalho Authorization

  if (!token) return res.sendStatus(401); // Se não houver token, retorna 401

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Se o token for inválido, retorna 403
    req.user = user; // Salva os dados do usuário no objeto request
    next(); // Chama o próximo middleware
  });
};

module.exports = authenticateToken; // Exporta o middleware
