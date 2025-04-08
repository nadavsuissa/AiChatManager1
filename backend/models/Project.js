/**
 * Project model - represents the structure of project documents in Firestore
 * This is used as a reference for the shape of project data
 */
const projectModel = {
  id: String, // Unique identifier (Firestore document ID)
  name: String, // Project name
  clientId: String, // Reference to client document
  address: String, // Project address
  city: String, // Project city
  type: String, // Project type (construction, renovation, etc.)
  startDate: String, // Project start date
  endDate: String, // Project end date (can be null)
  description: String, // Project description
  status: String, // Project status (active, completed, on hold, etc.)
  
  // OpenAI assistant fields
  assistantId: String, // OpenAI Assistant ID for this project
  threadId: String, // Default OpenAI Thread ID for this project
  
  // Timestamps
  createdAt: Date, // Date when the project was created
  updatedAt: Date, // Date when the project was last updated
  
  // Files related to the project
  files: [
    {
      id: String, // File ID 
      name: String, // Original file name
      type: String, // File MIME type
      url: String, // Download URL
      openaiFileId: String, // OpenAI File ID if uploaded to assistant
      uploadedAt: Date, // Upload date
    }
  ]
};

module.exports = projectModel; 