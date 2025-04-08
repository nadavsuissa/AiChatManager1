const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all tasks assigned to the current user across all projects
 */
exports.getUserTasks = async (req, res) => {
  try {
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log(`Fetching all tasks assigned to user: ${currentUserId}`);
    
    // Get all projects the user is a member of
    const projectsSnapshot = await db.collection('projects')
      .where('users', 'array-contains', { userId: currentUserId })
      .get();
    
    if (projectsSnapshot.empty) {
      console.log(`No projects found for user ${currentUserId}`);
      return res.status(200).json([]);
    }
    
    // Get tasks from each project
    const userTasks = [];
    
    // For each project, get tasks assigned to this user
    const projectPromises = projectsSnapshot.docs.map(async (projectDoc) => {
      const projectId = projectDoc.id;
      
      // Query tasks assigned to this user in this project
      const tasksSnapshot = await db.collection('projects').doc(projectId)
        .collection('tasks')
        .where('assignedTo', '==', currentUserId)
        .get();
      
      // Process tasks
      tasksSnapshot.forEach(doc => {
        const taskData = doc.data();
        userTasks.push({
          id: doc.id,
          ...taskData,
          // Convert timestamps to dates for consistent handling
          createdAt: taskData.createdAt && taskData.createdAt.toDate ? 
            taskData.createdAt.toDate() : taskData.createdAt,
          updatedAt: taskData.updatedAt && taskData.updatedAt.toDate ? 
            taskData.updatedAt.toDate() : taskData.updatedAt,
          dueDate: taskData.dueDate && taskData.dueDate.toDate ? 
            taskData.dueDate.toDate() : taskData.dueDate
        });
      });
    });
    
    // Wait for all project task queries to complete
    await Promise.all(projectPromises);
    
    console.log(`Found ${userTasks.length} tasks assigned to user ${currentUserId}`);
    res.status(200).json(userTasks);
  } catch (error) {
    console.error('Error getting user tasks:', error);
    res.status(500).json({ error: error.message || 'Failed to get user tasks' });
  }
};

/**
 * Get all tasks for a project
 */
exports.getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`Fetching tasks for project: ${projectId}`);
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get project to verify access
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      console.log(`Project not found: ${projectId}`);
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
    
    // Get tasks from project's tasks collection
    const tasksSnapshot = await db.collection('projects').doc(projectId)
      .collection('tasks')
      .orderBy('createdAt', 'desc')
      .get();
    
    const tasks = [];
    tasksSnapshot.forEach(doc => {
      const taskData = doc.data();
      
      // Add any data processing or formatting here if needed
      tasks.push({
        id: doc.id,
        ...taskData,
        // Convert timestamps to dates for consistent handling
        createdAt: taskData.createdAt && taskData.createdAt.toDate ? 
          taskData.createdAt.toDate() : taskData.createdAt,
        updatedAt: taskData.updatedAt && taskData.updatedAt.toDate ? 
          taskData.updatedAt.toDate() : taskData.updatedAt,
        dueDate: taskData.dueDate && taskData.dueDate.toDate ? 
          taskData.dueDate.toDate() : taskData.dueDate
      });
    });
    
    console.log(`Found ${tasks.length} tasks for project ${projectId}`);
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error getting project tasks:', error);
    res.status(500).json({ error: error.message || 'Failed to get tasks' });
  }
};

/**
 * Create a new task for a project
 */
exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const taskData = req.body;
    
    console.log(`Creating new task for project: ${projectId}`);
    
    // Validate required fields
    if (!taskData.title) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get project to verify access
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectDoc.data();
    
    // Check if user has editor or owner access
    const userRole = project.users.find(user => user.userId === currentUserId)?.role;
    if (!userRole || !['owner', 'editor'].includes(userRole)) {
      return res.status(403).json({ error: 'You do not have permission to create tasks in this project' });
    }
    
    // Add user details for creator
    const userInfo = project.users.find(user => user.userId === currentUserId);
    
    // If task is assigned, add assignee details
    let assigneeInfo = null;
    if (taskData.assignedTo) {
      assigneeInfo = project.users.find(user => user.userId === taskData.assignedTo);
      if (!assigneeInfo) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project' });
      }
    }
    
    // Prepare task object
    const task = {
      ...taskData,
      id: uuidv4(),
      projectId,
      createdBy: currentUserId,
      createdByName: userInfo?.displayName || 'Unknown user',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      // Add assignee details if present
      ...(assigneeInfo && {
        assigneeName: assigneeInfo.displayName || assigneeInfo.email,
        assigneePhotoURL: assigneeInfo.photoURL
      })
    };
    
    // Add task to project's tasks collection
    await db.collection('projects').doc(projectId)
      .collection('tasks')
      .doc(task.id)
      .set(task);
    
    console.log(`Task created successfully: ${task.id}`);
    
    // Update project's updatedAt timestamp
    await db.collection('projects').doc(projectId).update({
      updatedAt: new Date()
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
};

/**
 * Update an existing task
 */
exports.updateTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const updates = req.body;
    
    console.log(`Updating task ${taskId} in project ${projectId}`);
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get project to verify access
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectDoc.data();
    
    // Get task to check if it exists
    const taskDoc = await db.collection('projects').doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .get();
      
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskDoc.data();
    
    // Check permissions - allow updates by:
    // 1. Project owners or editors
    // 2. Task creator
    // 3. Assigned person (limited updates)
    const userRole = project.users.find(user => user.userId === currentUserId)?.role;
    const isTaskCreator = task.createdBy === currentUserId;
    const isAssignee = task.assignedTo === currentUserId;
    const canFullyEdit = userRole === 'owner' || userRole === 'editor' || isTaskCreator;
    
    if (!userRole) {
      return res.status(403).json({ error: 'You do not have permission to access this project' });
    }
    
    if (!canFullyEdit && !isAssignee) {
      return res.status(403).json({ error: 'You do not have permission to update this task' });
    }
    
    // If not an editor/owner, limit what assignee can update
    if (!canFullyEdit && isAssignee) {
      // Assignees can only update status and add comments
      const allowedUpdates = ['status', 'comments'];
      Object.keys(updates).forEach(key => {
        if (!allowedUpdates.includes(key)) {
          delete updates[key];
        }
      });
    }
    
    // If changing assignee, verify the user exists in project
    if (updates.assignedTo && updates.assignedTo !== task.assignedTo) {
      const assigneeInfo = project.users.find(user => user.userId === updates.assignedTo);
      if (!assigneeInfo) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project' });
      }
      
      // Add assignee details
      updates.assigneeName = assigneeInfo.displayName || assigneeInfo.email;
      updates.assigneePhotoURL = assigneeInfo.photoURL;
    }
    
    // Update task with timestamp
    const updatedTask = {
      ...updates,
      updatedAt: new Date()
    };
    
    await db.collection('projects').doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .update(updatedTask);
    
    // Update project's updatedAt timestamp
    await db.collection('projects').doc(projectId).update({
      updatedAt: new Date()
    });
    
    console.log(`Task ${taskId} updated successfully`);
    
    // Return the updated task data
    const updatedTaskDoc = await db.collection('projects').doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .get();
      
    res.status(200).json({
      id: updatedTaskDoc.id,
      ...updatedTaskDoc.data()
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message || 'Failed to update task' });
  }
};

/**
 * Delete a task
 */
exports.deleteTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    
    console.log(`Deleting task ${taskId} from project ${projectId}`);
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get project to verify access
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectDoc.data();
    
    // Get task to check if it exists and verify creator
    const taskDoc = await db.collection('projects').doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .get();
      
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskDoc.data();
    
    // Check permissions - only allow deletion by:
    // 1. Project owners
    // 2. Task creator
    const userRole = project.users.find(user => user.userId === currentUserId)?.role;
    const isTaskCreator = task.createdBy === currentUserId;
    
    if (userRole !== 'owner' && !isTaskCreator) {
      return res.status(403).json({ error: 'You do not have permission to delete this task' });
    }
    
    // Delete the task
    await db.collection('projects').doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .delete();
    
    // Update project's updatedAt timestamp
    await db.collection('projects').doc(projectId).update({
      updatedAt: new Date()
    });
    
    console.log(`Task ${taskId} deleted successfully`);
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
};

/**
 * Add a comment to a task
 */
exports.addTaskComment = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { content } = req.body;
    
    console.log(`Adding comment to task ${taskId} in project ${projectId}`);
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // Get the current user ID from auth
    const currentUserId = req.user?.uid;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get project to verify access
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectDoc.data();
    
    // Check if user has access to this project
    const userInfo = project.users.find(user => user.userId === currentUserId);
    if (!userInfo) {
      return res.status(403).json({ error: 'You do not have permission to access this project' });
    }
    
    // Get task to check if it exists
    const taskDoc = await db.collection('projects').doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .get();
      
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskDoc.data();
    
    // Create comment object
    const comment = {
      id: uuidv4(),
      content,
      createdBy: currentUserId,
      createdByName: userInfo.displayName || userInfo.email,
      createdByPhotoURL: userInfo.photoURL,
      createdAt: new Date()
    };
    
    // Add comment to task's comments array
    const comments = [...(task.comments || []), comment];
    
    // Update task with new comments and timestamp
    await db.collection('projects').doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .update({
        comments,
        updatedAt: new Date()
      });
    
    // Update project's updatedAt timestamp
    await db.collection('projects').doc(projectId).update({
      updatedAt: new Date()
    });
    
    console.log(`Comment added to task ${taskId}`);
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment to task:', error);
    res.status(500).json({ error: error.message || 'Failed to add comment' });
  }
}; 