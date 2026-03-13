import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { updateProfile } from '../modules/auth/index.js';

const router = Router();

router.put('/me', async (req: Request, res: Response) => {
  try {
    const { name, avatar_url } = req.body;

    if (!name && avatar_url === undefined) {
      res.status(400).json({ error: 'At least one field (name, avatar_url) is required' });
      return;
    }

    const user = await updateProfile(req.user!.id, { name, avatar_url });
    res.json({ data: user });
  } catch (error) {
    console.error('Error updating profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(500).json({ error: message });
  }
});

router.put('/me/notifications', async (req: Request, res: Response) => {
  // Stub: notification preferences
  // In a real app, store these in a user_preferences table
  const preferences = req.body;
  res.json({
    data: {
      message: 'Notification preferences updated',
      preferences,
    },
  });
});

router.put('/me/concurso', async (req: Request, res: Response) => {
  // Stub: switch active concurso
  // In a real app, update user's active concurso reference
  const { concurso_id } = req.body;

  if (!concurso_id) {
    res.status(400).json({ error: 'concurso_id is required' });
    return;
  }

  res.json({
    data: {
      message: 'Active concurso updated',
      concurso_id,
    },
  });
});

/**
 * DELETE /users/me
 * Delete the authenticated user's account.
 */
router.delete('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ data: { id: userId } });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
