import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse, Project, AssistantMessage, ProjectUser, ProjectFile, Task, TaskComment, SuggestedVisualizationsResponse } from '../types';
import { getAuth } from 'firebase/auth';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'; // Remove or comment out the old variable definition if it exists here

// Create an Axios instance
const api = axios.create({
  baseURL: '/api', // Use the relative path for Vercel deployment
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // Example timeout
});

// Add request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    // Get current Firebase auth token
    const auth = getAuth();
    const user = auth.currentUser;
    
    console.log('API Request to:', config.url);
    console.log('Auth state:', user ? 'User authenticated' : 'No user');
    
    if (user) {
      try {
        const token = await user.getIdToken();
        // Add token to headers if available
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Token added to request');
        } else {
          console.warn('Token is null despite user being authenticated');
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    } else {
      console.warn('No current user found for authentication');
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    
    // Check if the error is due to network issues and retry (maximum 2 retries)
    if (error.message.includes('Network Error') && !originalRequest._retry && originalRequest._retryCount < 2) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Retrying request due to network error. Attempt ${originalRequest._retryCount}/2`);
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Process API errors and return a standardized error response
 */
const handleApiError = (error: any, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    // Axios error with response from server
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    // HTTP error but no structured error response
    if (error.response?.status) {
      return `${fallbackMessage} (HTTP ${error.response.status})`;
    }
    
    // Network error
    if (error.message.includes('Network Error')) {
      return 'נראה שיש בעיית תקשורת. אנא בדוק את החיבור שלך לאינטרנט ונסה שוב.';
    }
  }
  
  // Default fallback error message
  return fallbackMessage;
};

// User Management API
export const addProjectUser = async (
  projectId: string, 
  email: string, 
  role: 'editor' | 'viewer'
): Promise<ApiResponse<{ user: ProjectUser }>> => {
  try {
    const response: AxiosResponse<{ user: ProjectUser, success: boolean, message: string }> = 
      await api.post(`/projects/${projectId}/users`, { email, role });
    
    return { data: { user: response.data.user } };
  } catch (error) {
    console.error('Error adding user to project:', error);
    const errorMessage = handleApiError(error, 'הוספת המשתמש לפרויקט נכשלה');
    return { error: errorMessage };
  }
};

export const updateProjectUserRole = async (
  projectId: string,
  userId: string,
  role: 'editor' | 'viewer'
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response: AxiosResponse<{ success: boolean, message: string }> = 
      await api.put(`/projects/${projectId}/users/${userId}`, { role });
    
    return { data: { success: response.data.success } };
  } catch (error) {
    console.error('Error updating user role:', error);
    const errorMessage = handleApiError(error, 'עדכון תפקיד המשתמש נכשל');
    return { error: errorMessage };
  }
};

export const removeProjectUser = async (
  projectId: string,
  userId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response: AxiosResponse<{ success: boolean, message: string }> = 
      await api.delete(`/projects/${projectId}/users/${userId}`);
    
    return { data: { success: response.data.success } };
  } catch (error) {
    console.error('Error removing user from project:', error);
    const errorMessage = handleApiError(error, 'הסרת המשתמש מהפרויקט נכשלה');
    return { error: errorMessage };
  }
};

// Projects API
export const getAllProjects = async (filters?: { 
  status?: string; 
  clientId?: string; 
  search?: string 
}): Promise<ApiResponse<Project[]>> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const response: AxiosResponse<Project[]> = await api.get(`/projects${queryString}`);
    return { data: response.data };
  } catch (error) {
    console.error('Error getting projects:', error);
    const errorMessage = handleApiError(error, 'טעינת הפרויקטים נכשלה');
    return { error: errorMessage };
  }
};

export const createProject = async (projectData: Omit<Project, 'id' | 'assistantId' | 'threadId' | 'createdAt' | 'updatedAt' | 'files' | 'users' | 'ownerId'>): Promise<ApiResponse<Project>> => {
  try {
    const response: AxiosResponse<Project> = await api.post('/projects', projectData);
    return { data: response.data };
  } catch (error) {
    console.error('Error creating project:', error);
    const errorMessage = handleApiError(error, 'יצירת הפרויקט נכשלה');
    return { error: errorMessage };
  }
};

export const getProject = async (id: string): Promise<ApiResponse<Project>> => {
  try {
    const response: AxiosResponse<Project> = await api.get(`/projects/${id}`);
    return { data: response.data };
  } catch (error) {
    console.error('Error getting project:', error);
    const errorMessage = handleApiError(error, 'טעינת הפרויקט נכשלה');
    return { error: errorMessage };
  }
};

// Assistant Chat API
export const getProjectMessages = async (projectId: string): Promise<ApiResponse<{ messages: AssistantMessage[] }>> => {
  try {
    const response: AxiosResponse<{ messages: AssistantMessage[], projectId: string, threadId: string }> = 
      await api.get(`/projects/${projectId}/messages`);
    return { data: response.data };
  } catch (error) {
    console.error('Error getting project messages:', error);
    const errorMessage = handleApiError(error, 'טעינת ההודעות נכשלה');
    return { error: errorMessage };
  }
};

export const sendProjectMessage = async (
  projectId: string, 
  message: string,
  fileIds?: string[]
): Promise<ApiResponse<{ message: AssistantMessage }>> => {
  try {
    const response: AxiosResponse<{ message: AssistantMessage, projectId: string, threadId: string }> = 
      await api.post(`/projects/${projectId}/messages`, {
        message,
        fileIds
      });
    return { data: response.data };
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage = handleApiError(error, 'שליחת ההודעה נכשלה');
    return { error: errorMessage };
  }
};

// File upload API
export const uploadProjectFile = async (
  projectId: string,
  file: File
): Promise<ApiResponse<{ file: { id: string, openaiFileId: string } }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response: AxiosResponse<{ file: { id: string, openaiFileId: string }, projectId: string }> = 
      await api.post(`/projects/${projectId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Increase timeout for file uploads
        timeout: 60000, // 60 seconds
      });
    
    return { data: response.data };
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = handleApiError(error, 'העלאת הקובץ נכשלה');
    return { error: errorMessage };
  }
};

export const getProjectFileDetails = async (
  projectId: string,
  fileId: string
): Promise<ApiResponse<{ file: ProjectFile }>> => {
  try {
    const response: AxiosResponse<{ file: ProjectFile }> = 
      await api.get(`/projects/${projectId}/files/${fileId}`);
    
    return { data: response.data };
  } catch (error) {
    console.error('Error getting file details:', error);
    const errorMessage = handleApiError(error, 'טעינת פרטי הקובץ נכשלה');
    return { error: errorMessage };
  }
};

export const getProjectAssistantFiles = async (
  projectId: string
): Promise<ApiResponse<{ assistantFiles: any[], fixedFiles: number }>> => {
  try {
    const response: AxiosResponse<{ assistantFiles: any[], fixedFiles: number }> =
      await api.get(`/projects/${projectId}/assistant/files`);
    
    return { data: response.data };
  } catch (error) {
    console.error('Error getting assistant files:', error);
    const errorMessage = handleApiError(error, 'טעינת קבצי העוזר נכשלה');
    return { error: errorMessage };
  }
};

// Task Management API
export const getProjectTasks = async (projectId: string): Promise<ApiResponse<Task[]>> => {
  try {
    const response: AxiosResponse<Task[]> = await api.get(`/tasks/projects/${projectId}/tasks`);
    return { data: response.data };
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    const errorMessage = handleApiError(error, 'קבלת המשימות נכשלה');
    return { error: errorMessage };
  }
};

export const createTask = async (
  projectId: string, 
  taskData: Partial<Task>
): Promise<ApiResponse<Task>> => {
  try {
    const response: AxiosResponse<Task> = await api.post(
      `/tasks/projects/${projectId}/tasks`, 
      taskData
    );
    return { data: response.data };
  } catch (error) {
    console.error('Error creating task:', error);
    const errorMessage = handleApiError(error, 'יצירת המשימה נכשלה');
    return { error: errorMessage };
  }
};

export const updateTask = async (
  projectId: string,
  taskId: string,
  updates: Partial<Task>
): Promise<ApiResponse<Task>> => {
  try {
    const response: AxiosResponse<Task> = await api.put(
      `/tasks/projects/${projectId}/tasks/${taskId}`,
      updates
    );
    return { data: response.data };
  } catch (error) {
    console.error('Error updating task:', error);
    const errorMessage = handleApiError(error, 'עדכון המשימה נכשל');
    return { error: errorMessage };
  }
};

export const deleteTask = async (
  projectId: string,
  taskId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.delete(
      `/tasks/projects/${projectId}/tasks/${taskId}`
    );
    return { data: response.data };
  } catch (error) {
    console.error('Error deleting task:', error);
    const errorMessage = handleApiError(error, 'מחיקת המשימה נכשלה');
    return { error: errorMessage };
  }
};

export const addTaskComment = async (
  projectId: string,
  taskId: string,
  content: string
): Promise<ApiResponse<TaskComment>> => {
  try {
    const response: AxiosResponse<TaskComment> = await api.post(
      `/tasks/projects/${projectId}/tasks/${taskId}/comments`,
      { content }
    );
    return { data: response.data };
  } catch (error) {
    console.error('Error adding comment:', error);
    const errorMessage = handleApiError(error, 'הוספת התגובה נכשלה');
    return { error: errorMessage };
  }
};

// Project invitation API
export const getUserInvitations = async (): Promise<ApiResponse<{ invitations: any[] }>> => {
  try {
    const response: AxiosResponse<{ invitations: any[] }> = await api.get('/invitations');
    return { data: response.data };
  } catch (error) {
    // For 404 errors, just return empty invitations without logging to console
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { 
        error: 'The invitations API endpoint is not implemented yet.',
        data: { invitations: [] } // Return empty invitations to prevent UI errors
      };
    }
    
    // Log other errors
    console.error('Error fetching user invitations:', error);
    const errorMessage = handleApiError(error, 'Failed to fetch invitations');
    return { error: errorMessage };
  }
};

export const respondToInvitation = async (
  invitationId: string, 
  accept: boolean
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.post(
      `/invitations/${invitationId}/respond`, 
      { accept }
    );
    return { data: response.data };
  } catch (error) {
    // For 404 errors, just return a failure without logging to console
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { 
        error: 'The invitation response API endpoint is not implemented yet.',
        data: { success: false }
      };
    }
    
    // Log other errors
    console.error('Error responding to invitation:', error);
    const errorMessage = handleApiError(error, 'Failed to respond to invitation');
    return { error: errorMessage };
  }
};

// User tasks API
export const getUserTasks = async (): Promise<ApiResponse<Task[]>> => {
  try {
    const response: AxiosResponse<Task[]> = await api.get('/tasks/user');
    return { data: response.data };
  } catch (error) {
    // For 404 errors, just return empty tasks without logging to console
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { 
        error: 'The user tasks API endpoint is not implemented yet.',
        data: [] // Return empty tasks to prevent UI errors
      };
    }
    
    // Log other errors
    console.error('Error fetching user tasks:', error);
    const errorMessage = handleApiError(error, 'Failed to fetch user tasks');
    return { error: errorMessage };
  }
};

// User Profile API
export const checkUsernameAvailable = async (username: string): Promise<ApiResponse<{ available: boolean }>> => {
  try {
    const response: AxiosResponse<{ available: boolean }> = await api.get(`/users/check-username/${username}`);
    return { data: response.data };
  } catch (error) {
    console.error('Error checking username availability:', error);
    const errorMessage = handleApiError(error, 'Failed to check username availability');
    return { error: errorMessage };
  }
};

export const updateUserProfile = async (
  userData: { firstName?: string; lastName?: string; username?: string; photoURL?: string }
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.put('/users/profile', userData);
    return { data: response.data };
  } catch (error) {
    console.error('Error updating user profile:', error);
    const errorMessage = handleApiError(error, 'Failed to update profile');
    return { error: errorMessage };
  }
};

export const updateProject = async (projectId: string, data: Partial<Project>): Promise<ApiResponse<Project>> => {
  try {
    const response: AxiosResponse<Project> = await api.patch(
      `/projects/${projectId}`,
      data
    );
    return { data: response.data };
  } catch (error) {
    console.error('Error updating project:', error);
    const errorMessage = handleApiError(error, 'עדכון הפרויקט נכשל');
    return { error: errorMessage };
  }
};

// Get suggested visualizations
export const getSuggestedVisualizations = async (
  projectId: string
): Promise<ApiResponse<SuggestedVisualizationsResponse>> => {
  try {
    const response: AxiosResponse<SuggestedVisualizationsResponse> = 
      await api.get(`/projects/${projectId}/visualizations`);
    return { data: response.data };
  } catch (error) {
    console.error('Error getting suggested visualizations:', error);
    const errorMessage = handleApiError(error, 'קבלת הצעות לתצוגות נכשלה');
    return { error: errorMessage };
  }
};

export default api; 