import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VerifiedUser as VerifiedUserIcon,
  AccountCircle as AccountCircleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AdminPanelSettings as AdminIcon,
  RemoveRedEye as ViewIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ProjectUser, Project } from '../types';
import { addProjectUser, updateProjectUserRole, removeProjectUser } from '../services/api';
import { getAuth } from 'firebase/auth';

// Type guard to check if an object is a Firebase Timestamp
function isFirebaseTimestamp(obj: any): obj is { toDate: () => Date } {
  return obj && typeof obj === 'object' && typeof obj.toDate === 'function';
}

interface ProjectTeamTabProps {
  project: Project;
  onProjectUpdated: () => void;
}

interface RoleLabel {
  label: string;
  icon: React.ReactElement;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const roleLabels: Record<string, RoleLabel> = {
  owner: { 
    label: 'בעלים', 
    icon: <AdminIcon fontSize="small" />, 
    color: 'secondary' 
  },
  editor: { 
    label: 'עורך', 
    icon: <EditIcon fontSize="small" />, 
    color: 'primary' 
  },
  viewer: { 
    label: 'צופה', 
    icon: <ViewIcon fontSize="small" />, 
    color: 'info' 
  },
};

const ProjectTeamTab: React.FC<ProjectTeamTabProps> = ({ project, onProjectUpdated }) => {
  const theme = useTheme();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  // State for user management
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditingUserId, setIsEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'editor' | 'viewer'>('viewer');
  
  // Check if current user is the owner
  const isOwner = currentUser && project.users.some(user => 
    user.userId === currentUser.uid && user.role === 'owner'
  );
  
  // Handle add user dialog
  const handleOpenAddDialog = () => {
    setAddUserDialogOpen(true);
    setNewUserEmail('');
    setNewUserRole('viewer');
    setError(null);
  };
  
  const handleCloseAddDialog = () => {
    setAddUserDialogOpen(false);
  };
  
  // Handle add user submission
  const handleAddUser = async () => {
    if (!newUserEmail) {
      setError('כתובת אימייל נדרשת');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await addProjectUser(project.id, newUserEmail, newUserRole);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage(`המשתמש ${newUserEmail} נוסף בהצלחה`);
        handleCloseAddDialog();
        onProjectUpdated(); // Refresh project data
      }
    } catch (err) {
      setError('אירעה שגיאה בהוספת המשתמש');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle role update
  const handleStartEditRole = (user: ProjectUser) => {
    setIsEditingUserId(user.userId);
    setEditRole(user.role as 'editor' | 'viewer');
  };
  
  const handleCancelEditRole = () => {
    setIsEditingUserId(null);
  };
  
  const handleSaveRole = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await updateProjectUserRole(project.id, userId, editRole);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage('תפקיד המשתמש עודכן בהצלחה');
        onProjectUpdated(); // Refresh project data
      }
    } catch (err) {
      setError('אירעה שגיאה בעדכון תפקיד המשתמש');
      console.error(err);
    } finally {
      setLoading(false);
      setIsEditingUserId(null);
    }
  };
  
  // Handle user removal
  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`האם אתה בטוח שברצונך להסיר את המשתמש ${userEmail} מהפרויקט?`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await removeProjectUser(project.id, userId);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage(`המשתמש ${userEmail} הוסר בהצלחה`);
        onProjectUpdated(); // Refresh project data
      }
    } catch (err) {
      setError('אירעה שגיאה בהסרת המשתמש');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Close success message snackbar
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };
  
  return (
    <Box sx={{ direction: 'rtl' }}>
      {/* Header with add user button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h6" component="h2">
          צוות הפרויקט
        </Typography>
        
        {isOwner && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ borderRadius: 2 }}
          >
            הוסף משתמש
          </Button>
        )}
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Team members table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 4, boxShadow: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.light, 0.1) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>משתמש</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>תפקיד</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>נוסף ע"י</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>תאריך הוספה</TableCell>
              {isOwner && <TableCell align="left">פעולות</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {project.users.map((user) => {
              // Find the user who added this user
              const addedByUser = project.users.find(u => u.userId === user.addedBy);
              const isCurrentUserRecord = currentUser && user.userId === currentUser.uid;
              
              return (
                <TableRow key={user.userId}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={user.photoURL || undefined} 
                        sx={{ 
                          mr: 1,
                          bgcolor: isCurrentUserRecord ? theme.palette.primary.main : undefined 
                        }}
                      >
                        {user.photoURL ? null : (
                          isCurrentUserRecord ? <VerifiedUserIcon /> : <AccountCircleIcon />
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: isCurrentUserRecord ? 'bold' : 'normal' }}>
                          {user.displayName || 'משתמש לא ידוע'}
                          {isCurrentUserRecord && (
                            <Typography component="span" variant="caption" sx={{ ml: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), p: 0.5, borderRadius: 1 }}>
                              אתה
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {isEditingUserId === user.userId ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          select
                          size="small"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'editor' | 'viewer')}
                          sx={{ minWidth: 120 }}
                          disabled={loading}
                        >
                          <MenuItem value="editor">עורך</MenuItem>
                          <MenuItem value="viewer">צופה</MenuItem>
                        </TextField>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleSaveRole(user.userId)}
                          disabled={loading}
                          size="small"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                        <IconButton 
                          color="default" 
                          onClick={handleCancelEditRole}
                          disabled={loading}
                          size="small"
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Chip
                        icon={roleLabels[user.role] ? roleLabels[user.role].icon : undefined}
                        label={roleLabels[user.role]?.label || user.role}
                        color={roleLabels[user.role]?.color || 'default'}
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {addedByUser ? (
                      <Tooltip title={addedByUser.email}>
                        <Typography variant="body2">
                          {addedByUser.displayName || addedByUser.email}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        לא ידוע
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {typeof user.addedAt === 'string' 
                      ? new Date(user.addedAt).toLocaleDateString('he-IL') 
                      : isFirebaseTimestamp(user.addedAt)
                        ? user.addedAt.toDate().toLocaleDateString('he-IL')
                        : user.addedAt instanceof Date
                          ? user.addedAt.toLocaleDateString('he-IL')
                          : 'לא זמין'}
                  </TableCell>
                  {isOwner && (
                    <TableCell align="left">
                      {user.role !== 'owner' && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {isEditingUserId !== user.userId && (
                            <Tooltip title="ערוך תפקיד">
                              <IconButton 
                                color="primary" 
                                onClick={() => handleStartEditRole(user)}
                                disabled={loading}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="הסר משתמש">
                            <IconButton 
                              color="error" 
                              onClick={() => handleRemoveUser(user.userId, user.email)}
                              disabled={loading}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Add user dialog */}
      <Dialog open={addUserDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>הוסף משתמש לפרויקט</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="כתובת אימייל"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              margin="dense"
              required
              autoFocus
              InputLabelProps={{ dir: 'rtl' }}
            />
            <TextField
              select
              fullWidth
              label="תפקיד"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'editor' | 'viewer')}
              margin="dense"
              InputLabelProps={{ dir: 'rtl' }}
            >
              <MenuItem value="editor">עורך - יכול לערוך את הפרויקט ולשלוח הודעות</MenuItem>
              <MenuItem value="viewer">צופה - יכול רק לצפות ולשלוח הודעות</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="inherit" disabled={loading}>
            ביטול
          </Button>
          <Button 
            onClick={handleAddUser} 
            color="primary" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            הוסף
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success message snackbar */}
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

export default ProjectTeamTab; 