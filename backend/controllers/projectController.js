const { db } = require('../config/firebase');
const { sendMessage, runAssistantAndGetLastMessageContent, ...openaiService } = require('../services/openai');
const { v4: uuidv4 } = require('uuid');
const userController = require('./userController');

/**
 * Create a new project with an associated OpenAI Assistant
 */
exports.createProject = async (req, res) => {
  try {
    console.log('Creating new project:', req.body.name);
    const projectData = req.body;
    
    if (!projectData.name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    // Get the current user ID from auth (assuming Firebase auth middleware)
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Create OpenAI assistant for this project
    const assistant = await openaiService.createAssistant(
      projectData.name, 
      projectData.id || uuidv4()
    );
    
    // Create a default thread for this project
    const threadId = await openaiService.createThread();
    
    // Add the current user as the owner
    const userDetails = {
      userId: currentUserId,
      email: req.user.email || 'Unknown email',
      displayName: req.user.displayName || 'Unknown user',
      photoURL: req.user.photoURL || null,
      role: 'owner',
      addedAt: new Date(),
      addedBy: currentUserId
    };
    
    // Prepare project document with assistant data
    const project = {
      ...projectData,
      assistantId: assistant.assistantId,
      threadId: threadId,
      createdAt: new Date(),
      updatedAt: new Date(),
      files: [],
      status: projectData.status || 'active',
      ownerId: currentUserId,
      users: [userDetails]
    };
    
    // Add to Firestore
    const projectRef = await db.collection('projects').add(project);
    
    console.log(`Project created successfully with ID: ${projectRef.id}`);
    
    // Return the created project with ID
    res.status(201).json({
      id: projectRef.id,
      ...project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
};

/**
 * Get all projects
 */
exports.getAllProjects = async (req, res) => {
  try {
    console.log('Fetching all projects');
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get projects with optional filtering
    const { status, clientId, search } = req.query;
    
    // Firestore doesn't support complex object queries with array-contains-any
    // So we need to use a simple query and filter in code
    let projectsQuery = db.collection('projects');
    
    // Apply filters if provided
    if (status) {
      projectsQuery = projectsQuery.where('status', '==', status);
    }
    
    if (clientId) {
      projectsQuery = projectsQuery.where('clientId', '==', clientId);
    }
    
    // Execute query
    const projectsSnapshot = await projectsQuery.orderBy('createdAt', 'desc').get();
    
    // Transform the data and filter by user access
    const projects = [];
    projectsSnapshot.forEach(doc => {
      const projectData = doc.data();
      
      // Check if user has access to this project (owner, editor, or viewer)
      const hasAccess = 
        projectData.ownerId === currentUserId || 
        (projectData.users && projectData.users.some(user => 
          user.userId === currentUserId && 
          ['owner', 'editor', 'viewer'].includes(user.role)
        ));
      
      if (hasAccess) {
        // Add project to array with its ID
        projects.push({
          id: doc.id,
          ...projectData,
          // Convert timestamps to ISO strings for consistent formatting
          createdAt: projectData.createdAt.toDate ? 
            projectData.createdAt.toDate().toISOString() : 
            new Date(projectData.createdAt).toISOString(),
          updatedAt: projectData.updatedAt.toDate ? 
            projectData.updatedAt.toDate().toISOString() : 
            new Date(projectData.updatedAt).toISOString()
        });
      }
    });
    
    // Filter by search term if provided
    let filteredProjects = projects;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProjects = projects.filter(project => 
        project.name.toLowerCase().includes(searchLower) ||
        project.address.toLowerCase().includes(searchLower) ||
        project.city.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower)
      );
    }
    
    console.log(`Found ${filteredProjects.length} projects`);
    // Ensure correct UTF-8 encoding for JSON response
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json(filteredProjects);
  } catch (error) {
    console.error('Error getting all projects:', error);
    res.status(500).json({ error: error.message || 'Failed to get projects' });
  }
};

/**
 * Get a single project by ID
 */
exports.getProject = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching project with ID: ${id}`);
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      console.log(`Project not found: ${id}`);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectData = projectDoc.data();
    
    // Check if the user has access to this project
    const hasAccess = projectData.users.some(user => 
      user.userId === currentUserId && ['owner', 'editor', 'viewer'].includes(user.role)
    );
    
    if (!hasAccess) {
      console.log(`User ${currentUserId} doesn't have access to project ${id}`);
      return res.status(403).json({ error: 'You do not have permission to access this project' });
    }
    
    // Ensure correct UTF-8 encoding for JSON response
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({
      id: projectDoc.id,
      ...projectData
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ error: error.message || 'Failed to get project' });
  }
};

/**
 * Add a user to a project
 */
exports.addProjectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    
    console.log(`Adding user ${email} to project ${id} with role ${role}`);
    
    // Validate input
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }
    
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be editor or viewer' });
    }
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectData = projectDoc.data();
    
    // Check if the current user is the owner
    const isOwner = projectData.users.some(user => 
      user.userId === currentUserId && user.role === 'owner'
    );
    
    if (!isOwner) {
      return res.status(403).json({ error: 'Only project owners can add users' });
    }
    
    // Check if the user is already in the project
    if (projectData.users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }
    
    try {
      // Validate user using the utility from userController
      const userData = await userController.validateUserEmail(email);
      
      // Add the user to the project
      const newUser = {
        userId: userData.userId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: role,
        addedAt: new Date(),
        addedBy: currentUserId
      };
      
      // Update the project
      await db.collection('projects').doc(id).update({
        users: [...projectData.users, newUser],
        updatedAt: new Date()
      });
      
      console.log(`User ${email} added to project ${id} with role ${role}`);
      
      res.status(200).json({
        success: true,
        message: 'User added successfully',
        user: newUser
      });
    } catch (userError) {
      if (userError.message === 'User not found') {
        return res.status(404).json({ error: 'User not registered. Please ask them to sign up first.' });
      }
      throw userError;
    }
  } catch (error) {
    console.error('Error adding user to project:', error);
    res.status(500).json({ error: error.message || 'Failed to add user to project' });
  }
};

/**
 * Update a user's role in a project
 */
exports.updateProjectUserRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    
    console.log(`Updating role of user ${userId} in project ${id} to ${role}`);
    
    // Validate input
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }
    
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be editor or viewer' });
    }
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectData = projectDoc.data();
    
    // Check if the current user is the owner
    const isOwner = projectData.users.some(user => 
      user.userId === currentUserId && user.role === 'owner'
    );
    
    if (!isOwner) {
      return res.status(403).json({ error: 'Only project owners can update user roles' });
    }
    
    // Find the user to update
    const userIndex = projectData.users.findIndex(user => user.userId === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found in project' });
    }
    
    // Prevent changing the role of the owner
    if (projectData.users[userIndex].role === 'owner') {
      return res.status(400).json({ error: 'Cannot change the role of the project owner' });
    }
    
    // Update the user's role
    const updatedUsers = [...projectData.users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      role
    };
    
    // Update the project
    await db.collection('projects').doc(id).update({
      users: updatedUsers,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: `User ${userId} role updated to ${role}`
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error.message || 'Failed to update user role' });
  }
};

/**
 * Remove a user from a project
 */
exports.removeProjectUser = async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    console.log(`Removing user ${userId} from project ${id}`);
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectData = projectDoc.data();
    
    // Check if the current user is the owner
    const isOwner = projectData.users.some(user => 
      user.userId === currentUserId && user.role === 'owner'
    );
    
    if (!isOwner) {
      return res.status(403).json({ error: 'Only project owners can remove users' });
    }
    
    // Find the user to remove
    const userIndex = projectData.users.findIndex(user => user.userId === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found in project' });
    }
    
    // Prevent removing the owner
    if (projectData.users[userIndex].role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove the project owner' });
    }
    
    // Remove the user
    const updatedUsers = projectData.users.filter(user => user.userId !== userId);
    
    // Update the project
    await db.collection('projects').doc(id).update({
      users: updatedUsers,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: `User ${userId} removed from project`
    });
  } catch (error) {
    console.error('Error removing user from project:', error);
    res.status(500).json({ error: error.message || 'Failed to remove user from project' });
  }
};

/**
 * Get all messages for a project's thread
 */
exports.getProjectMessages = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching messages for project: ${id}`);
    
    // Get project to find threadId
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      console.log(`Project not found: ${id}`);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectDoc.data();
    
    if (!project.threadId) {
      console.log(`Project has no thread: ${id}`);
      return res.status(400).json({ error: 'Project has no associated thread' });
    }
    
    // Get messages from OpenAI thread
    const messages = await openaiService.getMessages(project.threadId);
    
    res.status(200).json({
      projectId: id,
      threadId: project.threadId,
      messages
    });
  } catch (error) {
    console.error('Error getting project messages:', error);
    res.status(500).json({ error: error.message || 'Failed to get project messages' });
  }
};

/**
 * Send a message to the project's assistant
 */
exports.sendProjectMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, fileIds = [] } = req.body;
    
    console.log(`Sending message to project ${id} assistant`);
    
    // Validate input
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Get current user
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get project
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectDoc.data();
    
    // Check if user has access to this project
    const hasAccess = project.users.some(user => 
      user.userId === currentUserId && ['owner', 'editor', 'viewer'].includes(user.role)
    );
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to access this project' });
    }
    
    // Ensure project has thread and assistant IDs
    if (!project.threadId || !project.assistantId) {
      return res.status(400).json({ error: 'Project is missing assistant or thread configuration' });
    }
    
    // Send message to assistant using the directly imported function
    const response = await sendMessage(
      project.threadId, 
      project.assistantId, 
      message,
      fileIds,
      id // Pass project ID for thread rotation
    );
    
    // Check if thread was rotated and update project if needed
    if (response.threadRotated && response.newThreadId) {
      console.log(`Updating project ${id} with new thread ID: ${response.newThreadId}`);
      
      await db.collection('projects').doc(id).update({
        threadId: response.newThreadId,
        updatedAt: new Date()
      });
      
      // Remove threadRotated and newThreadId from response to client
      delete response.threadRotated;
      delete response.newThreadId;
    }
    
    // Store message in project history if needed
    // This could be implemented later
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error sending message to assistant:', error);
    res.status(500).json({ error: error.message || 'Failed to send message to assistant' });
  }
};

/**
 * Upload a file to a project and OpenAI
 */
exports.uploadProjectFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    console.log(`Uploading file to project ${id}: ${file?.originalname || 'unnamed'}, Size: ${file?.size || 0} bytes`);
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check file size limits
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB for safety (OpenAI limit is higher but we're being cautious)
    if (file.size > MAX_FILE_SIZE) {
      return res.status(413).json({ 
        error: `File too large. Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Please reduce file size or split into smaller files.` 
      });
    }
    
    // Get project
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      console.log(`Project not found: ${id}`);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectDoc.data();
    
    // Check if project has an assistant ID
    if (!project.assistantId) {
      return res.status(400).json({ error: 'Project does not have an associated assistant' });
    }
    
    // Upload to OpenAI with error handling and retries
    let openaiFileId;
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
      try {
        openaiFileId = await openaiService.uploadFile(
          file.buffer,
          file.originalname
        );
        break; // If upload succeeds, exit the loop
      } catch (uploadError) {
        retries++;
        console.error(`Upload attempt ${retries} failed:`, uploadError.message);
        
        if (retries >= MAX_RETRIES) {
          throw new Error(`Failed to upload after ${MAX_RETRIES} attempts: ${uploadError.message}`);
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    
    // Attach the file to the assistant using the new vector store approach
    let vectorStoreId = null;
    try {
      const result = await openaiService.attachFileToAssistant(project.assistantId, openaiFileId);
      vectorStoreId = result.vectorStoreId;
      console.log(`File ${openaiFileId} attached to assistant ${project.assistantId} via vector store ${vectorStoreId}`);
    } catch (attachError) {
      console.error('Error attaching file to assistant:', attachError);
      // We'll continue even if attaching fails, to at least store the file record
    }
    
    // Create file record
    const fileRecord = {
      id: uuidv4(),
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      url: '', // Would normally store URL from Firebase Storage
      openaiFileId,
      vectorStoreId,
      uploadedAt: new Date(),
      attachedToAssistant: !!vectorStoreId
    };
    
    // Update project with new file
    const files = [...(project.files || []), fileRecord];
    await db.collection('projects').doc(id).update({ 
      files,
      updatedAt: new Date()
    });
    
    console.log(`File uploaded successfully: ${fileRecord.id} (OpenAI ID: ${openaiFileId})`);
    
    res.status(200).json({
      projectId: id,
      file: fileRecord
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Provide a more specific error message if it's a known error type
    if (error.message && error.message.includes('413')) {
      return res.status(413).json({ 
        error: 'File size exceeds OpenAI\'s limit. Please reduce file size or try a different file format.' 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
};

/**
 * Get files attached to a project's assistant
 */
exports.getProjectAssistantFiles = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching assistant files for project: ${id}`);
    
    // Get project
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      console.log(`Project not found: ${id}`);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectDoc.data();
    
    // Check if project has an assistant ID
    if (!project.assistantId) {
      return res.status(400).json({ error: 'Project does not have an associated assistant' });
    }
    
    // Get files attached to the assistant
    const assistantFiles = await openaiService.getAssistantFiles(project.assistantId);
    
    // Extract OpenAI file IDs from assistant files
    const assistantFileIds = assistantFiles.map(file => file.id);
    
    // Compare with project files to check for consistency
    const projectFiles = project.files || [];
    
    // Identify files that are in project but not attached to assistant
    const unattachedFiles = projectFiles.filter(
      file => !assistantFileIds.includes(file.openaiFileId)
    );
    
    // Attach any files that are missing from the assistant
    const fixedFiles = [];
    for (const file of unattachedFiles) {
      try {
        const result = await openaiService.attachFileToAssistant(project.assistantId, file.openaiFileId);
        fixedFiles.push({
          id: file.id,
          name: file.name,
          vectorStoreId: result.vectorStoreId
        });
      } catch (error) {
        console.error(`Failed to attach file ${file.openaiFileId} to assistant:`, error.message);
      }
    }
    
    // Update file records in project to mark as attached
    if (fixedFiles.length > 0) {
      const updatedFiles = project.files.map(file => {
        if (fixedFiles.some(fixedFile => fixedFile.id === file.id)) {
          return { ...file, attachedToAssistant: true };
        }
        return file;
      });
      
      await db.collection('projects').doc(id).update({
        files: updatedFiles,
        updatedAt: new Date()
      });
    }
    
    res.status(200).json({
      projectId: id,
      assistantId: project.assistantId,
      assistantFiles: assistantFiles,
      fixedFiles: fixedFiles.length
    });
  } catch (error) {
    console.error('Error getting assistant files:', error);
    res.status(500).json({ error: error.message || 'Failed to get assistant files' });
  }
};

/**
 * Update a project by ID
 */
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`Updating project with ID: ${id}`);
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      console.log(`Project not found: ${id}`);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectData = projectDoc.data();
    
    // Check if the user has appropriate access to this project
    const userRole = projectData.users.find(user => user.userId === currentUserId)?.role;
    
    if (!userRole) {
      return res.status(403).json({ error: 'You do not have permission to access this project' });
    }
    
    // Only owners and editors can update projects
    if (userRole !== 'owner' && userRole !== 'editor') {
      return res.status(403).json({ error: 'You do not have permission to update this project' });
    }
    
    // Prevent updating certain fields
    const allowedUpdates = ['name', 'description', 'status', 'clientId', 'type', 'address', 'city', 'startDate', 'endDate'];
    
    // Filter out disallowed updates
    const safeUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        safeUpdates[key] = updates[key];
      }
    });
    
    // Add updatedAt timestamp
    safeUpdates.updatedAt = new Date();
    
    // Update the project
    await db.collection('projects').doc(id).update(safeUpdates);
    
    console.log(`Project ${id} updated successfully`);
    
    // Return the updated project
    const updatedProjectDoc = await db.collection('projects').doc(id).get();
    
    res.status(200).json({
      id: updatedProjectDoc.id,
      ...updatedProjectDoc.data()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
};

/**
 * Get suggested data visualizations for a project
 */
exports.getSuggestedVisualizations = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Getting suggested visualizations for project: ${id}`);

    // Get current user
    const currentUserId = req.user?.uid;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get project
    const projectDoc = await db.collection('projects').doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projectDoc.data();

    // Check if user has access to this project
    const hasAccess = project.users.some(user => 
      user.userId === currentUserId && ['owner', 'editor', 'viewer'].includes(user.role)
    );
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to access this project' });
    }

    // Ensure project has thread and assistant IDs
    if (!project.threadId || !project.assistantId) {
      console.warn(`Project ${id} is missing assistant or thread configuration for visualizations.`);
      return res.status(400).json({ error: 'Project is missing assistant or thread configuration needed for analysis.' });
    }

    // Define the prompt for the assistant
    const prompt = `
את/ה עוזר/ת AI המתמחה בניתוח נתוני פרויקטי בנייה. 
אנא נתח לעומק את **התוכן של הקבצים שהועלו לפרויקט** (כגון תוכניות, כתבי כמויות, הצעות מחיר, דוחות התקדמות, קבצי תקציב וכו') וכן את **רשימת המשימות** הפתוחות והסגורות.

בהתבסס אך ורק על המידע המופיע בקבצים ובמשימות, הצע דרכים רלוונטיות **למנהל פרויקט בנייה** להצגה חזותית של נתונים קריטיים.
התמקד/י במדדים כגון:
*   תקציבים וחלוקתם (לפי סעיפים, קבלנים, שלבים וכו').
*   מדדי כוח אדם (אם זמין בקבצים).
*   מעקב אחר יעדים וקצב התקדמות (לפי משימות, אבני דרך, לו"ז).
*   חלוקות של שטחים והשוואות בין אזורים/מגרשים/קומות (אם רלוונטי מהקבצים).
*   מדדי ביצוע מרכזיים (KPIs) אחרים הרלוונטיים לניהול פרויקט בנייה שניתן להסיק מהנתונים.

**חשוב מאוד:**
1.  השתמש/י אך ורק במידע מהקבצים והמשימות. אל תמציא/י נתונים.
2.  אל תציע/י תצוגות כלליות כמו "מספר קבצים" או "הודעות לפי משתמש". התמקד/י בניתוח התוכן.
3.  עבור כל הצעה, ציין/י כותרת ברורה, סוג תצוגה ('pie', 'bar', 'line', 'table'), תיאור קצר של התובנה, ואת הנתונים בפורמט JSON תקין.

פורמט JSON הנדרש:
{
  "visualizations": [
    {
      "title": "כותרת התצוגה (למשל, חלוקת תקציב לפי סעיפים עיקריים)",
      "type": "סוג התצוגה ('pie', 'bar', 'line', 'table')",
      "description": "תיאור קצר של מה התצוגה מראה (למשל, מציג את אחוז התקציב לכל סעיף מרכזי בפרויקט)",
      "data": {
        // Example for charts:
        "labels": ["שלד", "גמר", "מערכות", "פיתוח"],
        "datasets": [
          { "label": "תקציב (₪)", "data": [500000, 300000, 250000, 150000] }
        ]
        // Example for tables:
        // "headers": ["משימה", "סטטוס", "תאריך יעד"],
        // "rows": [
        //   ["הכנת יסודות", "הושלם", "01/04/2024"],
        //   ["בניית קומה 1", "בתהליך", "15/05/2024"]
        // ]
      }
    }
    // ... הצעות נוספות ...
  ]
}

אם אין מספיק נתונים רלוונטיים בקבצים ובמשימות ליצירת תצוגות משמעותיות מהסוג המבוקש, החזר/י אובייקט JSON עם "visualizations" ריק: {"visualizations": []}.
    `;

    // Use the new dedicated function to get the raw response content
    const responseText = await runAssistantAndGetLastMessageContent(
      project.threadId, 
      project.assistantId, 
      prompt
      // We can pass a specific timeout if needed, defaults to 90s
    );

    // Check if responseText is empty or null
    if (!responseText) {
        console.error(`Assistant returned empty content for project ${id} visualizations.`);
        return res.status(500).json({ error: 'העוזר החזיר תגובה ריקה.' });
    }

    let suggestedData = { visualizations: [] }; // Default to empty

    try {
      // Attempt to extract JSON from the response text
      let jsonStr = responseText;
      const jsonMatchMarkdown = jsonStr.match(/```(?:json)?\s*({[\s\S]*?})\s*```/i);
      if (jsonMatchMarkdown && jsonMatchMarkdown[1]) {
        jsonStr = jsonMatchMarkdown[1];
      } else {
        const jsonMatchPlain = jsonStr.match(/{[\s\S]*}/);
        if (jsonMatchPlain && jsonMatchPlain[0]) {
          jsonStr = jsonMatchPlain[0];
        } else {
           if (jsonStr.trim().includes('"visualizations": []')) {
              jsonStr = '{"visualizations": []}';
           } else {
              // If still no valid JSON object found, treat as error
              console.warn(`No valid JSON object structure found in assistant response for ${id}: ${responseText}`);
              throw new Error("No valid JSON object found in the assistant's response.");
           }
        }
      }
      
      jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      
      console.log(`Attempting to parse suggested visualizations JSON for project ${id}: ${jsonStr.substring(0, 150)}...`);
      suggestedData = JSON.parse(jsonStr);

      if (!suggestedData.visualizations || !Array.isArray(suggestedData.visualizations)) {
        console.error(`Invalid structure received from AI for visualizations project ${id}:`, suggestedData);
        suggestedData = { visualizations: [] };
      }

      console.log(`Successfully parsed ${suggestedData.visualizations.length} suggested visualizations for project ${id}.`);

    } catch (parseError) {
      console.error(`Error parsing suggested visualizations JSON for project ${id}:`, parseError.message);
      console.error(`Raw response text received from AI: ${responseText}`);
      return res.status(500).json({ error: 'שגיאה בעיבוד הצעות התצוגה מהעוזר.' });
    }

    res.status(200).json(suggestedData);

  } catch (error) {
    console.error(`Error getting suggested visualizations for project ${req.params.id}:`, error);
    // Check for specific error from the run function
    const errorMessage = error.message.includes('Assistant run failed') || error.message.includes('did not produce a valid text response')
        ? 'שגיאה בהפעלת העוזר או קבלת תגובה.'
        : 'שגיאה כללית ביצירת הצעות תצוגה.';
    res.status(500).json({ error: errorMessage });
  }
}; 