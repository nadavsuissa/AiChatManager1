const express = require('express');
const multer = require('multer');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer with options for proper filename handling
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  // Accept all files but sanitize the filename
  // The original filename is preserved in originalname property
  // Our controller will handle decoding it properly
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter
});

// Use auth middleware for all project routes
router.use(authMiddleware);

// Create a new project with OpenAI assistant
router.post('/', projectController.createProject);

// Get all projects (with optional filtering)
router.get('/', projectController.getAllProjects);

// Get project by ID
router.get('/:id', projectController.getProject);

// Update project by ID
router.patch('/:id', projectController.updateProject);

// User management routes
router.post('/:id/users', projectController.addProjectUser);
router.put('/:id/users/:userId', projectController.updateProjectUserRole);
router.delete('/:id/users/:userId', projectController.removeProjectUser);

// Get assistant files and verify attachments
router.get('/:id/assistant/files', projectController.getProjectAssistantFiles);

// Get all messages for a project's thread
router.get('/:id/messages', projectController.getProjectMessages);

// Send a message to project's assistant
router.post('/:id/messages', projectController.sendProjectMessage);

// Upload a file to the project and OpenAI
router.post('/:id/files', upload.single('file'), projectController.uploadProjectFile);

// Get suggested visualizations for a project
router.get('/:id/visualizations', projectController.getSuggestedVisualizations);

module.exports = router; 