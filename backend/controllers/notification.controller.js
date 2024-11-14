const { getSocket } = require('../socket');

exports.sendNotification = (req, res) => {
  const message = req.body.message || 'Nova notificação!';
  const io = getSocket();
  io.emit('notification', message);
  res.status(200).send({ success: true, message: 'Notificação enviada' });
};
