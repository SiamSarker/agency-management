const express = require('express');
const {
  getMessages,
  getChatRooms,
  getUnreadCount,
  markAsRead,
  deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/rooms', getChatRooms);
router.get('/unread/count', getUnreadCount);
router.get('/:userId', getMessages);
router.patch('/:userId/read', markAsRead);
router.delete('/:messageId', deleteMessage);

module.exports = router;
