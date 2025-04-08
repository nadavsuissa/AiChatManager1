const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// User tasks route
router.get('/user', taskController.getUserTasks);

// Project task routes
router.get('/projects/:projectId/tasks', taskController.getProjectTasks);
router.post('/projects/:projectId/tasks', taskController.createTask);
router.put('/projects/:projectId/tasks/:taskId', taskController.updateTask);
router.delete('/projects/:projectId/tasks/:taskId', taskController.deleteTask);
router.post('/projects/:projectId/tasks/:taskId/comments', taskController.addTaskComment);

module.exports = router; 