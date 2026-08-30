/**
 * Chat API Route Handler — POST /api/chat
 * Mounts on Express at /api/chat
 */

import { Router } from 'express';
import chatService from '../services/chatService.js';

const router = Router();

/**
 * POST /api/chat
 * Body: { message, conversationId, division, fir_number, context }
 * Response: { answer, conversationId, context }
 */
router.post('/', async (req, res) => {
  try {
    const {
      message,
      query, // Support query as alias for message
      conversationId,
      division = 'Bengaluru Division',
      fir_number = '',
      context = {}
    } = req.body || {};

    const textToProcess = message || query;

    if (!textToProcess || typeof textToProcess !== 'string' || !textToProcess.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: "message" is required and must be a non-empty string.'
      });
    }

    const result = await chatService.processChatMessage({
      message: textToProcess.trim(),
      conversationId,
      division,
      fir_number,
      context
    });

    return res.status(200).json({
      success: true,
      answer: result.answer,
      conversationId: result.conversationId,
      context: result.context
    });

  } catch (err) {
    console.error('[ChatRoute] Error processing message:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing the intelligence query.',
      details: err.message
    });
  }
});

export default router;
