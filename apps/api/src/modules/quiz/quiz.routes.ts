import { Router, Request, Response } from 'express';
import { generateQuizForTopic, submitQuiz, getQuizResults } from './quiz.service.js';

const router = Router();

// POST /quiz/generate — creates quiz questions for a topic
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { topic, disciplinaId } = req.body;

    if (!topic || !disciplinaId) {
      res.status(400).json({ error: 'topic and disciplinaId are required' });
      return;
    }

    const quizItem = await generateQuizForTopic(topic, disciplinaId);
    res.json({ data: quizItem });
  } catch (error) {
    console.error('Quiz generate error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// POST /quiz/submit — score answers, record attempt
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { contentItemId, answers } = req.body;

    if (!contentItemId || !answers) {
      res.status(400).json({ error: 'contentItemId and answers are required' });
      return;
    }

    const attempt = await submitQuiz(userId, contentItemId, answers);
    res.json({ data: attempt });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// GET /quiz/results/:attemptId — detailed results with explanations
router.get('/results/:attemptId', async (req: Request, res: Response) => {
  try {
    const attemptId = String(req.params.attemptId);
    const results = await getQuizResults(attemptId);

    if (!results) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }

    res.json({ data: results });
  } catch (error) {
    console.error('Quiz results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;
