import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import protect from '../middleware/auth.js';

const router = Router();
router.use(protect);

const validDate = value => value === '' || value === undefined ||
  (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value));

router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ completed: 1, dueDate: 1, createdAt: -1 });
    res.json({ tasks });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description = '', priority = 'Medium', dueDate = '' } = req.body;
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120)
      return res.status(400).json({ message: 'Enter a task title (up to 120 characters).' });
    if (typeof description !== 'string' || description.length > 500)
      return res.status(400).json({ message: 'Description must be 500 characters or fewer.' });
    if (!['Low', 'Medium', 'High'].includes(priority))
      return res.status(400).json({ message: 'Choose a valid priority.' });
    if (!validDate(dueDate))
      return res.status(400).json({ message: 'Due date must use YYYY-MM-DD format.' });

    const task = await Task.create({
      user: req.userId, title: title.trim(), description: description.trim(), priority, dueDate
    });
    res.status(201).json({ task });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid task ID.' });

    const allowed = ['title', 'description', 'completed', 'priority', 'dueDate'];
    const updates = {};
    for (const key of allowed) {
      if (Object.hasOwn(req.body, key)) updates[key] = req.body[key];
    }

    if (updates.title !== undefined &&
      (typeof updates.title !== 'string' || !updates.title.trim() || updates.title.trim().length > 120))
      return res.status(400).json({ message: 'Enter a valid task title.' });
    if (updates.description !== undefined &&
      (typeof updates.description !== 'string' || updates.description.length > 500))
      return res.status(400).json({ message: 'Description must be 500 characters or fewer.' });
    if (updates.completed !== undefined && typeof updates.completed !== 'boolean')
      return res.status(400).json({ message: 'Completed must be true or false.' });
    if (updates.priority !== undefined && !['Low', 'Medium', 'High'].includes(updates.priority))
      return res.status(400).json({ message: 'Choose a valid priority.' });
    if (updates.dueDate !== undefined && !validDate(updates.dueDate))
      return res.status(400).json({ message: 'Due date must use YYYY-MM-DD format.' });

    if (updates.title) updates.title = updates.title.trim();
    if (updates.description !== undefined) updates.description = updates.description.trim();

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ task });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid task ID.' });

    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted.' });
  } catch (err) { next(err); }
});

export default router;