import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  useTheme,
  alpha,
  Chip,
  Grid as MuiGrid,
  Card,
  CardContent,
  Tooltip,
  LinearProgress,
  GridProps,
  styled
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  Code as CodeIcon,
  CloudUpload as UploadIcon,
  ContentCopy as CopyIcon,
  FilePresent as GenericFileIcon,
  TextSnippet as TextIcon,
  Chat as ChatIcon,
  VerifiedUser as VerifiedIcon} from '@mui/icons-material';
import { uploadProjectFile, getProjectAssistantFiles } from '../services/api';
import { Project, ProjectFile } from '../types';

// Fix for MUI v5 Grid component with TypeScript
interface StyledGridProps extends GridProps {
  item?: boolean;
  container?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
}
const Grid = styled(MuiGrid)<StyledGridProps>({});

interface ProjectFilesTabProps {
  project: Project;
  onProjectUpdated: () => void;
  onSendFileToChat?: (fileId: string, fileName: string) => void;
}

const ProjectFilesTab: React.FC<ProjectFilesTabProps> = ({ 
  project, 
  onProjectUpdated,
  onSendFileToChat 
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <PdfIcon fontSize="large" color="error" />;
    } else if (fileType.includes('image')) {
      return <ImageIcon fontSize="large" color="primary" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <DocIcon fontSize="large" color="primary" />;
    } else if (fileType.includes('text') || fileType.includes('markdown')) {
      return <TextIcon fontSize="large" color="info" />;
    } else if (fileType.includes('json') || fileType.includes('javascript') || fileType.includes('html')) {
      return <CodeIcon fontSize="large" color="secondary" />;
    } else {
      return <GenericFileIcon fontSize="large" color="action" />;
    }
  };

  // Format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Format date
  const formatDate = (date: Date | string | any) => {
    try {
      // If it's a string, try to convert it to a Date
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString('he-IL');
      }
      
      // If it's already a Date object
      if (date instanceof Date) {
        return date.toLocaleDateString('he-IL');
      }
      
      // Handle Firebase timestamp or timestamp-like object
      if (date && typeof date === 'object') {
        // Try to use toDate() for Firebase timestamps
        if (typeof date.toDate === 'function') {
          return date.toDate().toLocaleDateString('he-IL');
        }
        
        // Try seconds/nanoseconds format from Firestore
        if (date.seconds !== undefined) {
          return new Date(date.seconds * 1000).toLocaleDateString('he-IL');
        }
      }
      
      // Fallback: return current date
      return new Date().toLocaleDateString('he-IL');
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'תאריך לא זמין';
    }
  };

  // Handle file browse click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file upload
  const uploadFile = async (file: File) => {
    if (!project.id) return;
    
    // Check file size before uploading (25MB limit)
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`הקובץ גדול מדי. הגודל המקסימלי הוא ${MAX_FILE_SIZE / (1024 * 1024)}MB. אנא הקטן את הקובץ או פצל אותו לקבצים קטנים יותר.`);
      return;
    }
    
    setCurrentFile(file);
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    // Simulate progress for better UX (since we don't have real progress events from the API)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const increment = Math.floor(Math.random() * 10) + 1;
        const newValue = Math.min(prev + increment, 95); // Cap at 95% until actual completion
        return newValue;
      });
    }, 500);
    
    try {
      const response = await uploadProjectFile(project.id, file);
      
      if (response.error) {
        setError(response.error);
      } else {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setSuccessMessage(`הקובץ ${file.name} הועלה בהצלחה`);
        onProjectUpdated(); // Refresh project data to show the new file
      }
    } catch (err) {
      setError('אירעה שגיאה בהעלאת הקובץ');
      console.error(err);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setCurrentFile(null);
      // Reset progress after completion animation
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Close success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Handle sending file to chat
  const handleSendToChat = (file: ProjectFile) => {
    if (onSendFileToChat) {
      onSendFileToChat(file.openaiFileId, file.name);
      setSuccessMessage(`הקובץ "${file.name}" נשלח לצ'אט`);
    }
  };

  // Verify files are attached to assistant
  const [verifying, setVerifying] = useState(false);
  
  const verifyAssistantFiles = async () => {
    setVerifying(true);
    setError(null);
    
    try {
      const response = await getProjectAssistantFiles(project.id);
      
      if (response.error) {
        setError(response.error);
      } else {
        const { fixedFiles, assistantFiles } = response.data!;
        if (fixedFiles > 0) {
          setSuccessMessage(`תוקן ${fixedFiles} קבצים חסרים בעוזר`);
          onProjectUpdated(); // Refresh project data
        } else {
          setSuccessMessage(`כל הקבצים מחוברים לעוזר בהצלחה (${assistantFiles.length} קבצים)`);
        }
      }
    } catch (err) {
      setError('אירעה שגיאה באימות קבצי העוזר');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box sx={{ direction: 'rtl' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h6" component="h2">
          קבצי פרויקט
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={verifying ? <CircularProgress size={20} /> : <VerifiedIcon />}
            onClick={verifyAssistantFiles}
            disabled={verifying || project.files.length === 0}
            size="small"
          >
            אמת חיבור קבצים לעוזר
          </Button>
          
          <Chip 
            label={`${project.files.length} קבצים`} 
            color="primary" 
            variant="outlined"
          />
        </Box>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Upload area */}
      <Paper
        elevation={3}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 4,
          mb: 4,
          textAlign: 'center',
          border: dragActive ? `2px dashed ${theme.palette.primary.main}` : '2px dashed #ccc',
          borderRadius: 2,
          cursor: 'pointer',
          bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.05)
          }
        }}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png,.json,.csv,.xlsx,.xls"
        />
        
        {uploading ? (
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              מעלה קובץ...
            </Typography>
            {currentFile && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {currentFile.name} ({formatFileSize(currentFile.size)})
              </Typography>
            )}
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ height: 10, borderRadius: 5, mb: 2, mt: 2 }} 
            />
            <Typography variant="body2" color="text.secondary">
              {uploadProgress}%
            </Typography>
          </Box>
        ) : (
          <>
            <UploadIcon fontSize="large" color="primary" sx={{ mb: 2, fontSize: '3rem' }} />
            <Typography variant="h6" gutterBottom>
              גרור קבצים לכאן או
            </Typography>
            <Button variant="contained" color="primary" component="span">
              בחר קובץ
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              תומך בקבצי PDF, Word, תמונות, וטקסט
            </Typography>
          </>
        )}
      </Paper>
      
      {/* Files list */}
      {project.files.length > 0 ? (
        <Grid container spacing={2}>
          {project.files.map((file) => (
            <Grid item xs={12} sm={6} md={4} key={file.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {getFileIcon(file.type)}
                    <Box sx={{ ml: 2, flexGrow: 1 }}>
                      <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
                        {file.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {file.type.split('/')[1]}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">
                      הועלה: {formatDate(file.uploadedAt)}
                    </Typography>
                    
                    <Box>
                      {onSendFileToChat && (
                        <Tooltip title="שלח לצ'אט">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendToChat(file);
                            }}
                          >
                            <ChatIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="העתק מזהה קובץ">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(file.openaiFileId);
                            setSuccessMessage('מזהה הקובץ הועתק ללוח');
                          }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', my: 4, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <FileIcon fontSize="large" color="disabled" sx={{ mb: 2, fontSize: '3rem', opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom color="text.secondary">
            אין קבצים בפרויקט זה
          </Typography>
          <Typography variant="body2" color="text.secondary">
            העלה קבצים כדי לשתף אותם עם העוזר החכם
          </Typography>
        </Box>
      )}
      
      {/* Success message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectFilesTab; 