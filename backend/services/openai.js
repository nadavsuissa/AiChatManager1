const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Creates a new OpenAI assistant for a project
 * @param {string} projectName - Name of the project to create an assistant for
 * @param {string} projectId - Firebase ID of the project
 * @returns {Promise<Object>} - The created assistant object
 */
async function createAssistant(projectName, projectId) {
  try {
    // Ensure Hebrew name is properly encoded
    const sanitizedName = projectName ? projectName.trim() : 'Project';
    
    const assistant = await openai.beta.assistants.create({
      name: `${sanitizedName} Assistant`,
      instructions: `You are a helpful assistant for the construction project "${sanitizedName}". 
                    You respond in Hebrew and help with any project related questions. 
                    You should be friendly, helpful, and concise.
                    Make sure all responses are properly formatted for Hebrew text display (right-to-left).
                    **IMPORTANT: Do not include any text referencing the source document directly in your response, such as "(המידע מופיע במסמך ...)" or similar phrases. Only provide the answer.**`,
      model: "o3-mini",
      tools: [{ type: "file_search" }],
    });

    console.log(`Created new assistant for project "${sanitizedName}": ${assistant.id}`);
    
    return {
      assistantId: assistant.id,
      name: assistant.name,
      created: assistant.created_at,
    };
  } catch (error) {
    console.error('Error creating assistant:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw new Error(`Failed to create OpenAI assistant: ${error.message}`);
  }
}

/**
 * Creates a thread for conversation with the assistant
 * @returns {Promise<string>} - The thread ID
 */
async function createThread() {
  try {
    const thread = await openai.beta.threads.create();
    console.log(`Created new thread: ${thread.id}`);
    return thread.id;
  } catch (error) {
    console.error('Error creating thread:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw new Error(`Failed to create OpenAI thread: ${error.message}`);
  }
}

/**
 * Uploads a file to OpenAI for use with assistants
 * @param {Buffer} fileBuffer - The file buffer to upload 
 * @param {string} fileName - The correctly decoded name of the file
 * @returns {Promise<string>} - The file ID
 */
async function uploadFile(fileBuffer, fileName) {
  try {
    // Ensure we have a valid file buffer
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new Error('Invalid file buffer provided');
    }
    
    // Ensure filename is a non-empty string
    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      console.warn('Invalid or empty filename provided for upload, using default.');
      fileName = 'uploaded_file'; // Provide a default fallback filename
    }

    console.log(`[uploadFile] Processing file "${fileName}" of size ${fileBuffer.length} bytes`);
    
    // Check file size before attempting to upload
    // OpenAI has a limit of ~25MB for files
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds OpenAI's limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Create a temporary file with a sanitized name that works on all filesystems
    // but preserve the original filename encoding
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const crypto = require('crypto');
    
    // Generate a safe temporary filename with random hash
    const tempId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(fileName) || '.tmp';
    const tempFilePath = path.join(os.tmpdir(), `upload_${tempId}${ext}`);
    
    // Write the buffer to the temporary file
    fs.writeFileSync(tempFilePath, fileBuffer);
    
    // Create a read stream from the temporary file
    const fileStream = fs.createReadStream(tempFilePath);
    
    console.log(`[uploadFile] Uploading stream to OpenAI (original filename: "${fileName}")`);
    
    // Upload using the file stream without explicit filename parameter
    // OpenAI API doesn't accept 'filename' parameter directly - it's determined from the stream
    const file = await openai.files.create({
      file: fileStream,
      purpose: "assistants",
    });
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (cleanupError) {
      console.warn(`Failed to clean up temporary file: ${cleanupError.message}`);
    }
    
    console.log(`Uploaded file "${fileName}" to OpenAI: ${file.id}`);
    return file.id;
  } catch (error) {
    console.error(`Error uploading file "${fileName}" to OpenAI:`, error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    // Add more specific error info if possible
    let errorMessage = `Failed to upload file "${fileName}" to OpenAI`;
    if (error.code) {
      errorMessage += ` (Code: ${error.code})`;
    }
    throw new Error(`${errorMessage}: ${error.message}`);
  }
}

/**
 * Handle Hebrew text encoding for OpenAI API
 * @param {string} text - Text that might contain Hebrew characters
 * @returns {string} - Properly encoded text
 */
function safeEncodeText(text) {
  if (!text) return '';
  
  // If already a string, make sure it's properly sanitized
  if (typeof text === 'string') {
    // Replace any potentially problematic characters
    return text.trim();
  }
  
  // If not a string, stringify it safely
  try {
    return JSON.stringify(text);
  } catch (error) {
    console.warn('Error stringifying text:', error.message);
    return String(text);
  }
}

/**
 * Adds a message to a thread and runs the assistant
 * @param {string} threadId - ID of the thread
 * @param {string} assistantId - ID of the assistant
 * @param {string} message - User message content (in Hebrew)
 * @param {Array<string>} fileIds - Optional array of file IDs to attach
 * @param {string} projectId - Optional project ID
 * @returns {Promise<Object>} - The assistant's response
 */
async function sendMessage(threadId, assistantId, message, fileIds = [], projectId = null) {
  try {
    // Handle Hebrew text by properly encoding it
    const safeMessage = safeEncodeText(message);
    
    // Check if thread needs rotation and get current/new threadId
    let currentThreadId = threadId;
    let threadRotated = false;
    
    if (projectId) {
      const threadStatus = await checkAndRotateThread(projectId, threadId, assistantId);
      currentThreadId = threadStatus.threadId;
      threadRotated = threadStatus.isNew;
      
      // If thread was rotated, we need to notify caller
      if (threadRotated) {
        console.log(`Thread rotated for project ${projectId}: ${threadId} -> ${currentThreadId}`);
      }
    }
    
    // Create message attachments if files are provided
    const attachments = fileIds.filter(Boolean).map(fileId => ({
      file_id: fileId,
      tools: [{ type: "file_search" }]
    }));
    
    // Add the message to the thread
    const createdMessage = await openai.beta.threads.messages.create(
      currentThreadId,
      {
        role: "user",
        content: safeMessage,
        ...(attachments.length > 0 && { attachments })
      }
    );
    
    console.log(`Added message to thread ${currentThreadId}: ${createdMessage.id}`);
    
    // Run the assistant on the thread
    console.log(`Running assistant ${assistantId} on thread ${currentThreadId}`);
    const run = await openai.beta.threads.runs.createAndPoll(
      currentThreadId,
      { assistant_id: assistantId }
    );
    
    if (run.status !== 'completed') {
      console.error(`Run ended with status: ${run.status}`, run);
      throw new Error(`Assistant run failed with status: ${run.status}`);
    }
    
    // Get the latest messages from the thread
    const messages = await openai.beta.threads.messages.list(
      currentThreadId
    );
    
    // Return the assistant's response with parsed citations if any
    const assistantMessages = messages.data
      .filter(msg => msg.role === 'assistant')
      .map(msg => {
        // Check if the message has text content
        if (msg.content[0]?.type === 'text') {
          const textContent = msg.content[0].text;
          
          // Start with the raw text value
          let finalContent = textContent.value;

          // Remove the automatic 【...】 citations
          // Regex: Matches 【 followed by any characters except 】, then 】
          finalContent = finalContent.replace(/【[^】]*】/g, '').trim();

          // Also remove the textual pattern from instructions, just in case
          finalContent = finalContent.replace(/\\(המידע מופיע במסמך "[^"]*"\\)/g, '').trim();

          // Add RTL embedding for assistant messages if it seems like Hebrew
          // A simple check for Hebrew characters
          if (/[\\u0590-\\u05FF]/.test(finalContent)) { 
            finalContent = `‫${finalContent}‬`; // Add RTL embedding
          }
          
          return {
            id: msg.id,
            content: finalContent, // Use the cleaned text
            citations: [], // Always return empty citations array now
            createdAt: msg.created_at,
            role: msg.role
          };
        }
        
        return null;
      })
      .filter(Boolean); // Remove any null entries
      
    const response = assistantMessages[0] || { 
      id: 'fallback',
      content: '\u202Bלא התקבלה תשובה מהעוזר. נסה שוב.\u202C',
      citations: [],
      createdAt: new Date().toISOString(),
      role: 'assistant'
    };
    
    // If thread was rotated, include that information in the response
    if (threadRotated) {
      return {
        ...response,
        threadRotated: true,
        newThreadId: currentThreadId
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error sending message:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw new Error(`Failed to get response from assistant: ${error.message}`);
  }
}

/**
 * Gets all messages in a thread
 * @param {string} threadId - ID of the thread
 * @returns {Promise<Array>} - Array of messages
 */
async function getMessages(threadId) {
  try {
    console.log(`Fetching messages for thread: ${threadId}`);
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Process and format messages for display
    return messages.data.map(msg => {
      // Default structure for all message types
      const messageObj = {
        id: msg.id,
        role: msg.role,
        createdAt: msg.created_at,
        content: '', // Initialize content
        citations: [] // Initialize citations
      };
      
      // Process content based on type
      if (msg.content[0]?.type === 'text') {
        const textContent = msg.content[0].text;
        
        // Start with the raw text value
        let finalContent = textContent.value;

        // Remove the automatic 【...】 citations
        finalContent = finalContent.replace(/【[^】]*】/g, '').trim();

        // Also remove the textual pattern from instructions
        finalContent = finalContent.replace(/\\(המידע מופיע במסמך "[^"]*"\\)/g, '').trim();
        
        // Add RTL embedding for assistant messages if it seems like Hebrew
        if (msg.role === 'assistant' && /[\\u0590-\\u05FF]/.test(finalContent)) {
          finalContent = `‫${finalContent}‬`; // Add RTL embedding
        }
        
        messageObj.content = finalContent; // Use the cleaned text
        
      } else {
        // Handle other content types if needed
        messageObj.content = msg.role === 'assistant' 
          ? "‫[תוכן הודעה לא נתמך]‬" 
          : "[Unsupported content]";
      }
      
      return messageObj;
    });
  } catch (error) {
    console.error('Error getting messages:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw new Error(`Failed to get messages from thread: ${error.message}`);
  }
}

/**
 * Attaches a file to an OpenAI assistant by adding it to the assistant's
 * single designated vector store. Creates the vector store if it doesn't exist.
 * @param {string} assistantId - ID of the assistant to attach the file to
 * @param {string} fileId - ID of the file to attach
 * @returns {Promise<Object>} - Object containing assistantId, fileId, and vectorStoreId
 */
async function attachFileToAssistant(assistantId, fileId) {
  try {
    if (!assistantId || !fileId) {
      throw new Error('Assistant ID and file ID are required');
    }

    console.log(`Attaching file ${fileId} to assistant ${assistantId}`);

    // 1. Retrieve the assistant to check for existing vector store
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    let vectorStoreId;

    // 2. Check if a vector store is already associated
    if (assistant.tool_resources?.file_search?.vector_store_ids?.length > 0) {
      vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];
      console.log(`Found existing vector store ${vectorStoreId} for assistant ${assistantId}`);
    } else {
      // 3. If no vector store, create a new one
      console.log(`No vector store found for assistant ${assistantId}, creating a new one.`);
      const vectorStore = await openai.vectorStores.create({
        name: `vs_for_${assistantId}`, // More descriptive name
        // expires_after: { anchor: "last_active_at", days: 7 } // Optional: Set expiration policy
      });
      vectorStoreId = vectorStore.id;
      console.log(`Created new vector store ${vectorStoreId} for assistant ${assistantId}`);

      // 4. Update the assistant to use this new vector store
      await openai.beta.assistants.update(assistantId, {
        tool_resources: { 
          file_search: { 
            vector_store_ids: [vectorStoreId] 
          } 
        }
      });
      console.log(`Updated assistant ${assistantId} to use vector store ${vectorStoreId}`);
    }

    // 5. Add the file to the determined vector store
    await openai.vectorStores.files.create(vectorStoreId, {
      file_id: fileId
    });
    console.log(`Added file ${fileId} to vector store ${vectorStoreId}`);

    // 6. Return the result
    return {
      assistantId,
      fileId,
      vectorStoreId // Return the ID of the store used (existing or new)
    };

  } catch (error) {
    console.error('Error attaching file to assistant:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    // Propagate a more specific error message if possible
    const message = error.message || 'Failed to attach file to assistant';
    throw new Error(message);
  }
}

/**
 * Gets the list of files attached to an assistant
 * @param {string} assistantId - ID of the assistant
 * @returns {Promise<Array>} - Array of file objects
 */
async function getAssistantFiles(assistantId) {
  try {
    if (!assistantId) {
      throw new Error('Assistant ID is required');
    }
    
    console.log(`Getting files for assistant ${assistantId}`);
    
    // Get the assistant details to find the vector store IDs
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    // Check if the assistant has tool_resources with vector stores
    if (!assistant.tool_resources?.file_search?.vector_store_ids || 
        assistant.tool_resources.file_search.vector_store_ids.length === 0) {
      console.log(`No vector stores found for assistant ${assistantId}`);
      return [];
    }
    
    // Get files from all vector stores associated with this assistant
    const allFiles = [];
    for (const vectorStoreId of assistant.tool_resources.file_search.vector_store_ids) {
      try {
        // List all files in this vector store
        const vectorStoreFiles = await openai.vectorStores.files.list(vectorStoreId);
        
        // Add files from this vector store to our collection
        for await (const file of vectorStoreFiles) {
          allFiles.push(file);
        }
        
        console.log(`Retrieved ${allFiles.length} files from vector store ${vectorStoreId}`);
      } catch (vectorStoreError) {
        console.error(`Error getting files from vector store ${vectorStoreId}:`, vectorStoreError.message);
      }
    }
    
    console.log(`Retrieved ${allFiles.length} total files for assistant ${assistantId}`);
    return allFiles;
  } catch (error) {
    console.error('Error getting assistant files:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw new Error(`Failed to get assistant files: ${error.message}`);
  }
}

/**
 * Checks if a thread needs rotation due to too many messages
 * If the message count exceeds threshold, creates a new thread
 * @param {string} projectId - The project ID
 * @param {string} threadId - Current thread ID to check
 * @param {string} assistantId - Assistant ID for the project
 * @returns {Promise<{threadId: string, isNew: boolean}>} - Returns current or new thread ID
 */
async function checkAndRotateThread(projectId, threadId, assistantId) {
  try {
    if (!threadId || !assistantId) {
      console.log('Missing threadId or assistantId, creating new thread');
      const newThreadId = await createThread();
      return { threadId: newThreadId, isNew: true };
    }
    
    // Get message count in current thread
    const messages = await openai.beta.threads.messages.list(threadId);
    const messageCount = messages.data.length;
    
    // Define threshold for thread rotation (adjust as needed)
    const MESSAGE_THRESHOLD = 50;
    
    console.log(`Thread ${threadId} has ${messageCount} messages`);
    
    // If under threshold, continue using current thread
    if (messageCount < MESSAGE_THRESHOLD) {
      return { threadId, isNew: false };
    }
    
    console.log(`Thread ${threadId} has reached message threshold (${MESSAGE_THRESHOLD}), rotating thread`);
    
    // Create a new thread
    const newThreadId = await createThread();
    
    // Optional: Create a summary message in the new thread
    await openai.beta.threads.messages.create(
      newThreadId,
      {
        role: "user",
        content: `This is a continuation of a previous conversation about project ${projectId}. The conversation history was rotated due to length.`
      }
    );
    
    // Update project with new threadId in database
    // This should be handled by the caller (projectController)
    
    console.log(`Created new thread ${newThreadId} for project ${projectId}`);
    
    return { threadId: newThreadId, isNew: true };
  } catch (error) {
    console.error('Error checking or rotating thread:', error);
    // On error, return the original thread to prevent disruption
    return { threadId, isNew: false };
  }
}

/**
 * Runs the assistant on a thread, waits for completion, and retrieves the raw text content
 * of the last message generated by the assistant during that run.
 * @param {string} threadId - ID of the thread
 * @param {string} assistantId - ID of the assistant
 * @param {string} prompt - The prompt/message content for the assistant
 * @param {number} timeoutMs - Maximum time to wait for the run to complete (in milliseconds)
 * @returns {Promise<string>} - The raw text content of the assistant's last message
 */
async function runAssistantAndGetLastMessageContent(threadId, assistantId, prompt, timeoutMs = 90000) {
  try {
    console.log(`Running assistant ${assistantId} on thread ${threadId} for specific task.`);

    // 1. Add the message
    const userMessage = await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: safeEncodeText(prompt),
      }
    );
    console.log(`Added task message to thread ${threadId}: ${userMessage.id}`);

    // 2. Create the run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      // Optional: Add instructions specific to this run if needed
      // instructions: "Please respond strictly in the requested format."
    });
    console.log(`Created run ${run.id} for thread ${threadId}`);

    // 3. Poll for completion
    const startTime = Date.now();
    let retrievedRun;
    while (Date.now() - startTime < timeoutMs) {
      retrievedRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      if (['completed', 'failed', 'cancelled', 'expired'].includes(retrievedRun.status)) {
        break;
      }
      // Wait for a short period before polling again
      await new Promise(resolve => setTimeout(resolve, 1500)); 
    }

    // 4. Check final status
    if (!retrievedRun || retrievedRun.status !== 'completed') {
      const status = retrievedRun ? retrievedRun.status : 'unknown';
      const errorDetails = retrievedRun?.last_error ? JSON.stringify(retrievedRun.last_error) : 'No details';
      console.error(`Run ${run.id} did not complete successfully. Status: ${status}. Error: ${errorDetails}`);
      throw new Error(`Assistant run failed or timed out. Status: ${status}`);
    }

    console.log(`Run ${run.id} completed successfully.`);

    // 5. Retrieve the messages added by this run
    // We list messages created *after* our user message, limit to 1, order descending.
    const messages = await openai.beta.threads.messages.list(threadId, {
      limit: 1, // We only need the very last message
      order: 'desc', // Get the latest message first
      // Optional: Use run_id if API supports it reliably for filtering messages
      // run_id: run.id 
    });

    // 6. Find the assistant message from the list
    const assistantMessage = messages.data.find(m => m.role === 'assistant' && m.run_id === run.id);

    if (!assistantMessage || assistantMessage.content[0]?.type !== 'text') {
      console.error(`Could not find a valid text message from the assistant for run ${run.id}. Last messages:`, messages.data);
      // Try checking the run steps for more details if needed
      // const runSteps = await openai.beta.threads.runs.steps.list(threadId, run.id);
      // console.error('Run steps:', runSteps.data);
      throw new Error('Assistant did not produce a valid text response for this run.');
    }

    // 7. Return the raw text content
    const rawContent = assistantMessage.content[0].text.value;
    console.log(`Retrieved raw content from assistant message ${assistantMessage.id}`);
    return rawContent;

  } catch (error) {
    console.error('Error running assistant and getting last message:', error);
    throw new Error(`Failed to run assistant and get response: ${error.message}`);
  }
}

module.exports = {
  createAssistant,
  createThread,
  uploadFile,
  sendMessage,
  getMessages,
  attachFileToAssistant,
  getAssistantFiles,
  checkAndRotateThread,
  runAssistantAndGetLastMessageContent
}; 