import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid as MuiGrid,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  Chip,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Stack,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Collapse,
  List,
  ListItem,
  Tab,
  Tabs,
  GridProps,
  styled
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  AssignmentTurnedIn as CompletedIcon,
  AssignmentLate as LateIcon,
  AssignmentReturned as InProgressIcon,
  Cancel as CancelledIcon,
  FlagOutlined as LowPriorityIcon,
  Flag as MediumPriorityIcon,
  Report as HighPriorityIcon,
  ReportProblem as UrgentIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  MoreVert as MoreIcon,
  Send as SendIcon,
  WatchLater as WatchLaterIcon,
  NewReleases as NewReleasesIcon,
} from '@mui/icons-material';

import { Project, Task, TaskStatus, TaskPriority, ProjectUser } from '../types';
import { 
  getProjectTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  addTaskComment 
} from '../services/api';
import { getAuth } from 'firebase/auth';
import { isFirebaseTimestamp } from '../utils/helpers';

// Helper function to safely get a comparable timestamp
const getTimestamp = (date: string | Date | { toDate: () => Date } | null): number => {
  if (!date) {
    return 0; // Treat null/undefined dates as epoch 0 for sorting
  }
  if (isFirebaseTimestamp(date)) {
    return date.toDate().getTime();
  }
  if (date instanceof Date) {
    return date.getTime();
  }
  // Attempt to parse if it's a string
  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
};

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

interface ProjectTasksTabProps {
  project: Project;
  onProjectUpdated: () => void;
}

// Status icons and labels
const statusConfig = {
  pending: { 
    icon: <TaskIcon fontSize="small" />, 
    label: 'בהמתנה',
    color: 'warning',
    chipColor: 'warning' 
  },
  in_progress: { 
    icon: <InProgressIcon fontSize="small" />, 
    label: 'בתהליך',
    color: 'info',
    chipColor: 'info'
  },
  completed: { 
    icon: <CompletedIcon fontSize="small" />, 
    label: 'הושלם',
    color: 'success',
    chipColor: 'success'  
  },
  cancelled: { 
    icon: <CancelledIcon fontSize="small" />, 
    label: 'בוטל',
    color: 'error',
    chipColor: 'default'  
  }
};

// Priority icons and labels
const priorityConfig = {
  low: { 
    icon: <LowPriorityIcon fontSize="small" />, 
    label: 'נמוכה',
    color: 'success'
  },
  medium: { 
    icon: <MediumPriorityIcon fontSize="small" />, 
    label: 'בינונית',
    color: 'info'
  },
  high: { 
    icon: <HighPriorityIcon fontSize="small" />, 
    label: 'גבוהה',
    color: 'warning'
  },
  urgent: { 
    icon: <UrgentIcon fontSize="small" />, 
    label: 'דחופה',
    color: 'error'
  }
};

const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ project, onProjectUpdated }) => {
  const theme = useTheme();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for task filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  
  // State for task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignedTo: null,
    dueDate: null
  });
  
  // State for task editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // State for task menu
  const [taskMenuAnchor, setTaskMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // State for comments
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  
  // Check user permissions
  const userRole = project.users.find(user => currentUser && user.userId === currentUser.uid)?.role;
  const canCreateTasks = userRole === 'owner' || userRole === 'editor';
  
  // Define fetchTasks using useCallback to make it stable
  const fetchTasks = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const response = await getProjectTasks(project.id);
      if (response.data) {
        // Ensure tasks are sorted by due date using the helper
        const sortedTasks = response.data.sort((a, b) => 
          getTimestamp(a.dueDate) - getTimestamp(b.dueDate)
        );
        setTasks(sortedTasks);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch tasks.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  // Load tasks on mount and when fetchTasks changes (due to project.id change)
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // First filter by view mode (all or mine)
    if (viewMode === 'mine' && currentUser && task.assignedTo !== currentUser.uid) {
      return false;
    }
    
    // Then filter by status
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }
    
    // Then filter by assignee
    if (filterAssignee !== 'all' && task.assignedTo !== filterAssignee) {
      return false;
    }
    
    return true;
  });
  
  // Handle opening the new task dialog
  const handleOpenTaskDialog = () => {
    setNewTask({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      assignedTo: null,
      dueDate: null
    });
    setEditingTaskId(null);
    setTaskDialogOpen(true);
  };
  
  // Handle editing a task
  const handleEditTask = (task: Task) => {
    setNewTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate
    });
    setEditingTaskId(task.id);
    setTaskDialogOpen(true);
    setTaskMenuAnchor(null);
  };
  
  // Handle closing the task dialog
  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false);
  };
  
  // Handle saving a task (create or update)
  const handleSaveTask = async () => {
    if (!newTask.title) {
      setError('כותרת המשימה נדרשת');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (editingTaskId) {
        // Update existing task
        const response = await updateTask(project.id, editingTaskId, newTask);
        if (response.error) {
          setError(response.error);
        } else {
          setSuccessMessage('המשימה עודכנה בהצלחה');
          fetchTasks();
          handleCloseTaskDialog();
        }
      } else {
        // Create new task
        const response = await createTask(project.id, newTask);
        if (response.error) {
          setError(response.error);
        } else {
          setSuccessMessage('המשימה נוצרה בהצלחה');
          fetchTasks();
          handleCloseTaskDialog();
        }
      }
    } catch (err) {
      setError('אירעה שגיאה בשמירת המשימה');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle deleting a task
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await deleteTask(project.id, taskId);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage('המשימה נמחקה בהצלחה');
        fetchTasks();
      }
    } catch (err) {
      setError('אירעה שגיאה במחיקת המשימה');
      console.error(err);
    } finally {
      setLoading(false);
      setTaskMenuAnchor(null);
    }
  };
  
  // Handle updating task status
  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      // Log the update attempt for debugging
      console.log(`Updating task ${taskId} status to ${status}`);
      
      // Optimistic UI update first
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
      
      // API call to update the status
      const response = await updateTask(project.id, taskId, { status });
      
      if (response.error) {
        console.error('Error updating task status:', response.error);
        setError(response.error);
        // Revert the optimistic update on error
        fetchTasks();
      } else {
        setSuccessMessage(`סטטוס המשימה עודכן ל${statusConfig[status].label}`);
        // Refresh tasks to ensure we have the latest data
        fetchTasks();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('אירעה שגיאה בעדכון סטטוס המשימה');
      // Revert the optimistic update on error
      fetchTasks();
    } finally {
      setLoading(false);
      setTaskMenuAnchor(null);
    }
  };
  
  // Handle task menu open
  const handleTaskMenuOpen = (event: React.MouseEvent<HTMLElement>, taskId: string) => {
    setTaskMenuAnchor(event.currentTarget);
    setActiveTaskId(taskId);
  };
  
  // Handle task menu close
  const handleTaskMenuClose = () => {
    setTaskMenuAnchor(null);
    setActiveTaskId(null);
  };
  
  // Handle expanding a task to show comments
  const handleExpandTask = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };
  
  // Handle adding a comment
  const handleAddComment = async (taskId: string) => {
    if (!newComment.trim()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await addTaskComment(project.id, taskId, newComment);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage('התגובה נוספה בהצלחה');
        setNewComment('');
        fetchTasks();
      }
    } catch (err) {
      setError('אירעה שגיאה בהוספת התגובה');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date | string | null | any) => {
    if (!date) return 'לא נקבע';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (isFirebaseTimestamp(date)) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'לא זמין';
    }
    
    return dateObj.toLocaleDateString('he-IL');
  };
  
  // Get user display name
  const getUserName = (userId: string | null) => {
    if (!userId) return 'לא משויך';
    const user = project.users.find(u => u.userId === userId);
    return user ? (user.displayName || user.email) : 'משתמש לא מוכר';
  };
  
  // Check if user can edit a task
  const canEditTask = (task: Task) => {
    if (userRole === 'owner' || userRole === 'editor') return true;
    if (currentUser && task.createdBy === currentUser.uid) return true;
    return false;
  };
  
  // Check if user is the task assignee
  const isTaskAssignee = (task: Task) => {
    return currentUser && task.assignedTo === currentUser.uid;
  };
  
  // Handle clicking on the status chip to open the task menu
  const handleStatusChipClick = (event: React.MouseEvent<HTMLDivElement>, taskId: string) => {
    // Open the task menu at the clicked element's position
    handleTaskMenuOpen(event, taskId);
  };
  
  return (
    <Box sx={{ direction: 'rtl' }}>
      {/* Header with add task button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
          משימות הפרויקט
        </Typography>
        
        {canCreateTasks && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenTaskDialog}
            sx={{ 
              borderRadius: 8,
              px: 3,
              py: 1,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: theme.shadows[2]
              }
            }}
          >
            הוסף משימה
          </Button>
        )}
      </Box>
      
      {/* Filters */}
      <Paper sx={{ 
        p: 2.5, 
        mb: 4, 
        borderRadius: 2,
        boxShadow: 'rgba(0, 0, 0, 0.04) 0px 3px 5px',
        direction: 'rtl'
      }}>
        <Grid 
          container 
          spacing={3} 
          alignItems="center"
        >
          <Grid item xs={12} sm={6} md={3}>
            <Tabs
              value={viewMode}
              onChange={(e, newValue) => setViewMode(newValue)}
              textColor="primary"
              indicatorColor="primary"
              variant="fullWidth"
              sx={{
                minHeight: 40,
                direction: 'rtl',
                '& .MuiTab-root': {
                  minHeight: 40,
                  fontSize: '0.875rem',
                },
                '& .MuiTabs-flexContainer': {
                  flexDirection: 'row'
                },
                '& .MuiTabs-indicator': {
                  transition: 'right 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'
                }
              }}
            >
              <Tab value="all" label="כל המשימות" />
              <Tab value="mine" label="המשימות שלי" />
            </Tabs>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined" sx={{ direction: 'rtl' }}>
              <InputLabel id="status-filter-label" sx={{ right: 14, left: 'auto' }}>סטטוס</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                label="סטטוס"
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ 
                  borderRadius: 1,
                  direction: 'rtl',
                  textAlign: 'right'
                }}
                MenuProps={{ 
                  anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                  transformOrigin: { vertical: 'top', horizontal: 'right' },
                  PaperProps: { style: { direction: 'rtl' } }
                }}
              >
                <MenuItem value="all">הכל</MenuItem>
                <MenuItem value="pending">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                    {statusConfig.pending.icon}
                    <span>{statusConfig.pending.label}</span>
                  </Box>
                </MenuItem>
                <MenuItem value="in_progress">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                    {statusConfig.in_progress.icon}
                    <span>{statusConfig.in_progress.label}</span>
                  </Box>
                </MenuItem>
                <MenuItem value="completed">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                    {statusConfig.completed.icon}
                    <span>{statusConfig.completed.label}</span>
                  </Box>
                </MenuItem>
                <MenuItem value="cancelled">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                    {statusConfig.cancelled.icon}
                    <span>{statusConfig.cancelled.label}</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined" sx={{ direction: 'rtl' }}>
              <InputLabel id="assignee-filter-label" sx={{ right: 14, left: 'auto' }}>משויך ל</InputLabel>
              <Select
                labelId="assignee-filter-label"
                value={filterAssignee}
                label="משויך ל"
                onChange={(e) => setFilterAssignee(e.target.value)}
                sx={{ 
                  borderRadius: 1,
                  direction: 'rtl',
                  textAlign: 'right'
                }}
                MenuProps={{ 
                  anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                  transformOrigin: { vertical: 'top', horizontal: 'right' },
                  PaperProps: { style: { direction: 'rtl' } }
                }}
              >
                <MenuItem value="all">הכל</MenuItem>
                {project.users.map(user => (
                  <MenuItem key={user.userId} value={user.userId}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      <Avatar 
                        src={user.photoURL || undefined} 
                        sx={{ width: 24, height: 24 }}
                      >
                        {!user.photoURL && (user.displayName?.[0] || user.email?.[0] || '?')}
                      </Avatar>
                      <span>{user.displayName || user.email}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
              <Chip 
                label={`${filteredTasks.length} משימות`} 
                size="small"
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, direction: 'rtl' }}>
          {error}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Tasks grid */}
      {!loading && filteredTasks.length === 0 ? (
        <Paper sx={{ 
          p: 5, 
          textAlign: 'center', 
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
          boxShadow: 'none',
          direction: 'rtl'
        }}>
          <TaskIcon sx={{ fontSize: 70, color: alpha(theme.palette.primary.main, 0.2), mb: 3 }} />
          <Typography variant="h6" color="text.primary" sx={{ mb: 1, fontWeight: 500 }}>
            אין משימות
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
            לא נמצאו משימות התואמות לסינון הנוכחי
          </Typography>
          {canCreateTasks && (
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={handleOpenTaskDialog}
              sx={{ 
                borderRadius: 8,
                px: 3,
                py: 1,
                fontWeight: 500
              }}
            >
              צור משימה חדשה
            </Button>
          )}
        </Paper>
      ) : (
        <Grid 
          container 
          spacing={3}
        >
          {filteredTasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  position: 'relative',
                  transition: 'all 0.2s ease-in-out',
                  overflow: 'visible',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.1),
                  direction: 'rtl',
                  textAlign: 'right',
                  '&:hover': {
                    boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px',
                    transform: 'translateY(-2px)'
                  },
                  ...(task.status === 'completed' && {
                    borderTop: `3px solid ${theme.palette.success.main}`,
                  }),
                  ...(task.status === 'in_progress' && {
                    borderTop: `3px solid ${theme.palette.info.main}`,
                  }),
                  ...(task.status === 'pending' && {
                    borderTop: `3px solid ${theme.palette.warning.main}`,
                  }),
                  ...(task.status === 'cancelled' && {
                    borderTop: `3px solid ${theme.palette.grey[500]}`,
                    opacity: 0.75
                  })
                }}
              >
                {task.priority === 'urgent' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      bgcolor: alpha(theme.palette.error.main, 0.9),
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      py: 0.5,
                      px: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      zIndex: 1,
                      fontWeight: 500
                    }}
                  >
                    <UrgentIcon sx={{ fontSize: 14 }} />
                    {priorityConfig.urgent.label}
                  </Box>
                )}
                
                <Box sx={{ 
                  p: 3, 
                  pb: 2,
                  display: 'flex', 
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                  direction: 'rtl'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar 
                      src={task.assigneePhotoURL || undefined}
                      sx={{ 
                        width: 42, 
                        height: 42,
                        bgcolor: task.assignedTo ? 
                          (task.assignedTo === currentUser?.uid ? 
                            theme.palette.primary.main : 
                            theme.palette.grey[600]) : 
                          theme.palette.grey[400]
                      }}
                    >
                      {task.assigneePhotoURL ? null : <PersonIcon />}
                    </Avatar>
                    
                    <Box>
                      <Typography variant="subtitle1" fontWeight="500" noWrap sx={{ maxWidth: 180 }}>
                        {task.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {getUserName(task.assignedTo)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {(canEditTask(task) || isTaskAssignee(task)) && (
                    <IconButton 
                      onClick={(e) => handleTaskMenuOpen(e, task.id)}
                      size="small"
                      sx={{ mt: -0.5, ml: -0.5 }}
                    >
                      <MoreIcon />
                    </IconButton>
                  )}
                </Box>
                
                <CardContent sx={{ p: 3, pt: 2, flexGrow: 1, pb: '16px !important', direction: 'rtl' }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      height: '3em', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 3,
                      lineHeight: 1.5
                    }}
                  >
                    {task.description || 'אין תיאור למשימה זו'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.75, 
                      color: task.dueDate && getTimestamp(task.dueDate) < Date.now() && task.status !== 'completed' ? 
                        theme.palette.error.main : 'text.secondary'
                    }}>
                      <WatchLaterIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(task.dueDate)}
                      </Typography>
                    </Box>
                    
                    <Chip 
                      size="small"
                      label={statusConfig[task.status].label}
                      icon={statusConfig[task.status].icon}
                      color={statusConfig[task.status].chipColor as any}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskMenuOpen(e, task.id);
                      }}
                      sx={{ 
                        height: 28, 
                        fontWeight: 500, 
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.9,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }
                      }}
                    />
                  </Box>
                </CardContent>
                
                <CardActions sx={{ 
                  px: 3, 
                  pt: 0,
                  pb: 3,
                  mt: 2,
                  gap: 1,
                  display: 'flex',
                  justifyContent: 'flex-start',
                  borderTop: 'none',
                  direction: 'rtl'
                }}>
                  {isTaskAssignee(task) && task.status !== 'completed' && task.status !== 'cancelled' && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleUpdateStatus(task.id, 'completed')}
                      sx={{ 
                        borderRadius: 6,
                        px: 2,
                        py: 0.75,
                        fontSize: '0.75rem',
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: theme.shadows[1]
                        },
                        fontWeight: 500
                      }}
                    >
                      סיים משימה
                    </Button>
                  )}
                  
                  <Button 
                    variant="text"
                    startIcon={<CommentIcon />}
                    size="small"
                    color="inherit"
                    onClick={() => handleExpandTask(task.id)}
                    sx={{ 
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      },
                      mr: 'auto'
                    }}
                  >
                    {task.comments?.length || 0} תגובות
                  </Button>
                </CardActions>
                
                {/* Comments section */}
                <Collapse in={expandedTaskId === task.id} timeout="auto" unmountOnExit>
                  <Box sx={{ 
                    p: 3, 
                    pt: 1, 
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                    direction: 'rtl' 
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                      תגובות
                    </Typography>
                    
                    {/* Comments list */}
                    <List disablePadding sx={{ direction: 'rtl' }}>
                      {task.comments && task.comments.length > 0 ? (
                        task.comments.map(comment => (
                          <ListItem 
                            key={comment.id}
                            alignItems="flex-start"
                            disableGutters
                            sx={{ 
                              px: 1.5, 
                              py: 1.5,
                              borderRadius: 2,
                              mb: 1.5,
                              bgcolor: alpha(theme.palette.background.default, 0.7),
                              direction: 'rtl'
                            }}
                          >
                            <Grid container spacing={1} sx={{ direction: 'rtl' }}>
                              <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, direction: 'rtl' }}>
                                  <Avatar 
                                    src={comment.createdByPhotoURL || undefined}
                                    sx={{ width: 28, height: 28, ml: 1 }}
                                  >
                                    {comment.createdByPhotoURL ? null : 
                                      comment.createdBy === currentUser?.uid ? 'אני' : comment.createdByName?.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 0.5 }}>
                                    {comment.createdByName || getUserName(comment.createdBy)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                    {typeof comment.createdAt === 'string' 
                                      ? new Date(comment.createdAt).toLocaleString('he-IL') 
                                      : isFirebaseTimestamp(comment.createdAt)
                                        ? comment.createdAt.toDate().toLocaleString('he-IL')
                                        : comment.createdAt instanceof Date
                                          ? comment.createdAt.toLocaleString('he-IL')
                                          : 'לא זמין'}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ pl: 4.5 }}>
                                  {comment.content}
                                </Typography>
                              </Grid>
                            </Grid>
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                          אין תגובות עדיין
                        </Typography>
                      )}
                    </List>
                    
                    {/* Add comment form */}
                    <Box sx={{ display: 'flex', mt: 3, alignItems: 'flex-start', direction: 'rtl' }}>
                      <Avatar 
                        src={currentUser?.photoURL || undefined}
                        sx={{ width: 32, height: 32, ml: 1.5 }}
                      >
                        {currentUser?.displayName?.[0] || currentUser?.email?.[0] || '?'}
                      </Avatar>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="הוסף תגובה..."
                        variant="outlined"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        multiline
                        rows={1}
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            borderRadius: 2,
                            fontSize: '0.9rem',
                            backgroundColor: alpha(theme.palette.background.default, 0.5)
                          },
                          direction: 'rtl'
                        }}
                      />
                      <IconButton 
                        color="primary"
                        onClick={() => handleAddComment(task.id)}
                        disabled={!newComment.trim()}
                        sx={{ 
                          mr: 1,
                          mt: 0.5,
                          bgcolor: newComment.trim() ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          '&:hover': {
                            bgcolor: newComment.trim() ? alpha(theme.palette.primary.main, 0.2) : 'transparent'
                          }
                        }}
                      >
                        <SendIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Collapse>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Task menu */}
      <Menu
        anchorEl={taskMenuAnchor}
        open={Boolean(taskMenuAnchor)}
        onClose={handleTaskMenuClose}
        TransitionProps={{ mountOnEnter: true, unmountOnExit: true }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
            overflow: 'visible',
            mt: 0.5,
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: -5,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'rotate(45deg)',
              zIndex: 0,
            },
          },
          '& .MuiMenuItem-root': {
            px: 2,
            py: 1.2,
            fontSize: '0.875rem',
          }
        }}
      >
        {activeTaskId && canEditTask(tasks.find(t => t.id === activeTaskId) as Task) && (
          <>
            <MenuItem onClick={() => {
              const task = tasks.find(t => t.id === activeTaskId);
              if (task) handleEditTask(task);
            }}>
              <ListItemIcon>
                <EditIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
              </ListItemIcon>
              <ListItemText>ערוך משימה</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => {
              if (activeTaskId) handleDeleteTask(activeTaskId);
            }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
              </ListItemIcon>
              <ListItemText>מחק משימה</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}
        
        {activeTaskId && (() => {
          const task = tasks.find(t => t.id === activeTaskId);
          if (!task) return null;
          
          // Don't show status options if the task is cancelled
          if (task.status === 'cancelled') return null;
          
          // Don't show current status as option
          const availableStatuses = Object.keys(statusConfig).filter(
            status => status !== task.status
          ) as TaskStatus[];
          
          return (
            <>
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 2, 
                  py: 0.5, 
                  display: 'block', 
                  color: 'text.secondary',
                  fontWeight: 'bold'
                }}
              >
                עדכן סטטוס
              </Typography>
              
              {availableStatuses.map(status => (
                <MenuItem 
                  key={status} 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    if (activeTaskId) {
                      handleUpdateStatus(activeTaskId, status);
                      handleTaskMenuClose(); // Close the menu after selection
                    }
                  }}
                  sx={{ pl: 3 }}
                >
                  <ListItemIcon>
                    {statusConfig[status].icon}
                  </ListItemIcon>
                  <ListItemText>{statusConfig[status].label}</ListItemText>
                </MenuItem>
              ))}
            </>
          );
        })()}
      </Menu>
      
      {/* Task dialog */}
      <Dialog 
        open={taskDialogOpen} 
        onClose={handleCloseTaskDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            direction: 'rtl',
            background: theme => theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.9) 
              : theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        {/* Styled Header */}
        <Box sx={{ 
          p: 3,
          background: theme => `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <Box sx={{ 
            borderRadius: '50%', 
            bgcolor: 'rgba(255, 255, 255, 0.2)', 
            p: 1,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {editingTaskId ? <EditIcon fontSize="medium" /> : <AddIcon fontSize="medium" />}
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
            {editingTaskId ? 'עריכת משימה' : 'הוספת משימה חדשה'}
          </Typography>
        </Box>
        
        <DialogContent sx={{ px: 4, py: 4, pb: 2 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                boxShadow: theme => `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
              }}
            >
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3} sx={{ direction: 'rtl' }}>
            {/* Section: Task Details */}
            <Grid item xs={12}>
              <Box sx={{ 
                mb: 3, 
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  right: 0,
                  width: 60,
                  height: 3,
                  backgroundColor: theme => theme.palette.primary.main,
                  borderRadius: 3,
                }
              }}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                  <TaskIcon sx={{ mr: 1, color: 'primary.main' }} />
                  פרטי המשימה
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="כותרת משימה *"
                fullWidth
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                variant="outlined"
                error={!newTask.title && error?.includes('כותרת')}
                helperText={!newTask.title && error?.includes('כותרת') ? 'כותרת המשימה נדרשת' : ''}
                InputProps={{ 
                  style: { direction: 'rtl' },
                  sx: {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
                  }
                }}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="תיאור המשימה"
                fullWidth
                multiline
                rows={4}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                variant="outlined"
                InputProps={{ 
                  style: { direction: 'rtl' },
                  sx: {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
                  }
                }}
                placeholder="הוסף פרטים על המשימה, הנחיות לביצוע או הערות חשובות..."
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            
            {/* Section: Status and Priority */}
            <Grid item xs={12}>
              <Box sx={{ 
                my: 2, 
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  right: 0,
                  width: 60,
                  height: 3,
                  backgroundColor: theme => theme.palette.primary.main,
                  borderRadius: 3,
                }
              }}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                  <LowPriorityIcon sx={{ mr: 1, color: 'primary.main' }} />
                  עדיפות וסטטוס
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={{ direction: 'rtl' }}>
                <InputLabel id="task-status-label" sx={{ right: 14, left: 'auto' }}>סטטוס</InputLabel>
                <Select
                  labelId="task-status-label"
                  id="task-status"
                  value={newTask.status || 'pending'}
                  label="סטטוס"
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                  sx={{ 
                    borderRadius: 2,
                    fontSize: '0.95rem',
                    direction: 'rtl',
                    textAlign: 'right',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
                  }}
                  MenuProps={{ 
                    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                    transformOrigin: { vertical: 'top', horizontal: 'right' },
                    PaperProps: { 
                      style: { direction: 'rtl' },
                      sx: { borderRadius: 2, mt: 0.5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }
                    }
                  }}
                >
                  <MenuItem value="pending">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      {statusConfig.pending.icon}
                      <span>{statusConfig.pending.label}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="in_progress">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      {statusConfig.in_progress.icon}
                      <span>{statusConfig.in_progress.label}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="completed">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      {statusConfig.completed.icon}
                      <span>{statusConfig.completed.label}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      {statusConfig.cancelled.icon}
                      <span>{statusConfig.cancelled.label}</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={{ direction: 'rtl' }}>
                <InputLabel id="task-priority-label" sx={{ right: 14, left: 'auto' }}>עדיפות</InputLabel>
                <Select
                  labelId="task-priority-label"
                  id="task-priority"
                  value={newTask.priority || 'medium'}
                  label="עדיפות"
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                  sx={{ 
                    borderRadius: 2,
                    fontSize: '0.95rem',
                    direction: 'rtl',
                    textAlign: 'right',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
                  }}
                  MenuProps={{ 
                    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                    transformOrigin: { vertical: 'top', horizontal: 'right' },
                    PaperProps: { 
                      style: { direction: 'rtl' },
                      sx: { borderRadius: 2, mt: 0.5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' } 
                    }
                  }}
                >
                  <MenuItem value="low">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: theme => theme.palette.success.main,
                        mr: 1
                      }} />
                      <span>{priorityConfig.low.label}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: theme => theme.palette.info.main,
                        mr: 1
                      }} />
                      <span>{priorityConfig.medium.label}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="high">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: theme => theme.palette.warning.main,
                        mr: 1
                      }} />
                      <span>{priorityConfig.high.label}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="urgent">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: theme => theme.palette.error.main,
                        mr: 1
                      }} />
                      <span>{priorityConfig.urgent.label}</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Section: Assignment and Date */}
            <Grid item xs={12}>
              <Box sx={{ 
                my: 2, 
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  right: 0,
                  width: 60,
                  height: 3,
                  backgroundColor: theme => theme.palette.primary.main,
                  borderRadius: 3,
                }
              }}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  אחראי ומועד
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={{ direction: 'rtl' }}>
                <InputLabel id="assignee-label" sx={{ right: 14, left: 'auto' }}>משויך ל</InputLabel>
                <Select
                  labelId="assignee-label"
                  id="assignee"
                  value={newTask.assignedTo || ''}
                  label="משויך ל"
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value || null })}
                  sx={{ 
                    borderRadius: 2,
                    fontSize: '0.95rem',
                    direction: 'rtl',
                    textAlign: 'right',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
                  }}
                  MenuProps={{ 
                    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                    transformOrigin: { vertical: 'top', horizontal: 'right' },
                    PaperProps: { 
                      style: { direction: 'rtl' },
                      sx: { borderRadius: 2, mt: 0.5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' } 
                    }
                  }}
                >
                  <MenuItem value="">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.400' }}>
                        <PersonIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <span>לא משויך</span>
                    </Box>
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  {project.users.map(user => (
                    <MenuItem key={user.userId} value={user.userId}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                        <Avatar 
                          src={user.photoURL || undefined} 
                          sx={{ width: 24, height: 24 }}
                        >
                          {!user.photoURL && (user.displayName?.[0] || user.email?.[0] || '?')}
                        </Avatar>
                        <span>{user.displayName || user.email}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="תאריך יעד"
                type="date"
                fullWidth
                value={newTask.dueDate ? new Date(getTimestamp(newTask.dueDate)).toISOString().split('T')[0] : ''}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value ? new Date(e.target.value) : null })}
                variant="outlined"
                InputLabelProps={{ shrink: true, style: { right: 0, left: 'auto' } }}
                InputProps={{ 
                  style: { direction: 'rtl' },
                  sx: {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: theme => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
                  }
                }}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <Box sx={{ 
          p: 3,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2
        }}>
          <Button 
            onClick={handleCloseTaskDialog} 
            variant="outlined"
            sx={{ 
              borderRadius: 8,
              px: 3,
              py: 1,
              fontWeight: 500,
              borderColor: alpha(theme.palette.primary.main, 0.5),
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleSaveTask} 
            variant="contained" 
            color="primary"
            disabled={loading || !newTask.title}
            startIcon={loading ? <CircularProgress size={20} /> : (editingTaskId ? <EditIcon /> : <AddIcon />)}
            sx={{ 
              borderRadius: 8,
              px: 4,
              py: 1,
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              }
            }}
          >
            {editingTaskId ? 'עדכן משימה' : 'צור משימה'}
          </Button>
        </Box>
      </Dialog>
      
      {/* Success message snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ direction: 'rtl' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%', borderRadius: 8, direction: 'rtl' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectTasksTab; 