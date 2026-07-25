const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Listing = require('../models/Listing');
const Message = require('../models/Message');

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const conversationView = (conversation, userId) => {
  const isBuyer = conversation.buyer._id.toString() === userId.toString();
  const otherUser = isBuyer ? conversation.seller : conversation.buyer;

  return {
    id: conversation._id,
    listing: conversation.listing,
    otherUser: {
      id: otherUser._id,
      name: otherUser.name,
      avatarUrl: otherUser.avatarUrl || null
    },
    lastMessageText: conversation.lastMessageText || null,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
};

const messageView = (message) => ({
  id: message._id,
  sender: message.sender,
  text: message.text,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt
});

const getConversationOrThrow = async (conversationId) => {
  if (!mongoose.isObjectIdOrHexString(conversationId)) {
    throw badRequest('Conversation ID is invalid.');
  }

  const conversation = await Conversation.findById(conversationId)
    .populate('listing', 'title price images status seller')
    .populate('buyer', 'name avatarUrl')
    .populate('seller', 'name avatarUrl');
  if (!conversation) {
    const error = new Error('Conversation not found.');
    error.statusCode = 404;
    throw error;
  }
  return conversation;
};

const ensureParticipant = (conversation, userId) => {
  const isParticipant = conversation.buyer._id.toString() === userId.toString()
    || conversation.seller._id.toString() === userId.toString();
  if (!isParticipant) {
    const error = new Error('You can only access your own conversations.');
    error.statusCode = 403;
    throw error;
  }
};

const startConversation = async (req, res, next) => {
  try {
    const { listingId, message } = req.body;
    if (!mongoose.isObjectIdOrHexString(listingId)) throw badRequest('listingId must be a valid listing ID.');

    const listing = await Listing.findById(listingId);
    if (!listing) {
      const error = new Error('Listing not found.');
      error.statusCode = 404;
      throw error;
    }
    if (listing.seller.toString() === req.user._id.toString()) {
      throw badRequest('You cannot start a conversation about your own listing.');
    }

    let conversation = await Conversation.findOne({ listing: listing._id, buyer: req.user._id });
    let created = false;
    if (!conversation) {
      if (listing.status !== 'available') throw badRequest('You cannot start a conversation about a sold listing.');
      try {
        conversation = await Conversation.create({ listing: listing._id, buyer: req.user._id, seller: listing.seller });
        created = true;
      } catch (error) {
        if (error.code !== 11000) throw error;
        conversation = await Conversation.findOne({ listing: listing._id, buyer: req.user._id });
      }
    }

    if (message !== undefined) {
      if (typeof message !== 'string' || !message.trim()) throw badRequest('message must be non-empty text.');
      if (message.trim().length > 1000) throw badRequest('message cannot exceed 1000 characters.');
      const text = message.trim();
      await Message.create({ conversation: conversation._id, sender: req.user._id, text });
      conversation.lastMessageText = text;
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    const populatedConversation = await getConversationOrThrow(conversation._id);
    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Conversation started successfully.' : 'Conversation retrieved successfully.',
      conversation: conversationView(populatedConversation, req.user._id)
    });
  } catch (error) {
    next(error);
  }
};

const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] })
      .populate('listing', 'title price images status seller')
      .populate('buyer', 'name avatarUrl')
      .populate('seller', 'name avatarUrl')
      .sort({ lastMessageAt: -1 });
    res.json({ success: true, conversations: conversations.map((conversation) => conversationView(conversation, req.user._id)) });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const conversation = await getConversationOrThrow(req.params.conversationId);
    ensureParticipant(conversation, req.user._id);
    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });
    res.json({ success: true, conversation: conversationView(conversation, req.user._id), messages: messages.map(messageView) });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const conversation = await getConversationOrThrow(req.params.conversationId);
    ensureParticipant(conversation, req.user._id);
    if (typeof req.body.text !== 'string' || !req.body.text.trim()) throw badRequest('text must be non-empty text.');
    const text = req.body.text.trim();
    if (text.length > 1000) throw badRequest('text cannot exceed 1000 characters.');

    const message = await Message.create({ conversation: conversation._id, sender: req.user._id, text });
    conversation.lastMessageText = text;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    res.status(201).json({ success: true, message: 'Message sent successfully.', data: messageView(message) });
  } catch (error) {
    next(error);
  }
};

module.exports = { startConversation, getMyConversations, getMessages, sendMessage };
