const express = require('express');
const multer = require('multer');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer with options for proper filename handling
const storage = multer.memoryStorage();

// Enhanced file filter with more logging
const fileFilter = (req, file, cb) => {
  console.log('Multer processing file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    encoding: file.encoding,
    mimetype: file.mimetype
  });
  
  // Check if file has content
  if (!file.originalname) {
    console.warn('File has no name, rejecting');
    cb(new Error('File has no name'), false);
    return;
  }
  
  // Accept all valid files
  cb(null, true);
};

// Enhanced error handling for multer
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter
});

// Add a custom error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    console.error('Multer error:', err.code, err.message);
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    // An unknown error occurred
    console.error('Unknown upload error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred during file upload' });
  }
  
  // No error
  next();
};

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

// Upload a file to the project and OpenAI - with Multer error handling
router.post('/:id/files', upload.single('file'), handleMulterError, projectController.uploadProjectFile);

// Get suggested visualizations for a project
router.get('/:id/visualizations', projectController.getSuggestedVisualizations);

module.exports = router; 