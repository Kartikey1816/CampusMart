const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  startConversation,
  getMyConversations,
  getMessages,
  sendMessage
} = require('../controllers/conversationController');

const router = express.Router();

router.use(protect);
router.route('/').get(getMyConversations).post(startConversation);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);

module.exports = router;
