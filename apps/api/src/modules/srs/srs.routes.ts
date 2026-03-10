import { Router, Request, Response } from 'express';
import { recordReview, getDueFlashcards } from './srs.service.js';

const router = Router();

// POST /srs/review — record a flashcard review with self-rating
router.post('/review', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { contentItemId, rating } = req.body;

    if (!contentItemId || !rating) {
      res.status(400).json({ error: 'contentItemId and rating are required' });
      return;
    }

    const validRatings = ['again', 'hard', 'good', 'easy'];
    if (!validRatings.includes(rating)) {
      res.status(400).json({ error: 'rating must be one of: again, hard, good, easy' });
      return;
    }

    const review = await recordReview(userId, contentItemId, rating);
    res.json({ data: review });
  } catch (error) {
    console.error('SRS review error:', error);
    res.status(500).json({ error: 'Failed to record review' });
  }
});

// GET /srs/due — get flashcards due for review today
router.get('/due', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const items = await getDueFlashcards(userId);
    res.json({ data: items });
  } catch (error) {
    console.error('SRS due error:', error);
    res.status(500).json({ error: 'Failed to fetch due flashcards' });
  }
});

export default router;
