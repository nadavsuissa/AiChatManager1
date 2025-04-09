import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  Divider,
  Card,
  CardContent,
  Chip,
  useTheme,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Chat as ChatIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  FileCopy as FilesIcon,
  Assignment as TasksIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { getProject, getProjectMessages, sendProjectMessage, updateProject, getSuggestedVisualizations } from '../services/api';
import { Project, AssistantMessage, MessageCitation, Visualization, SuggestedVisualizationsResponse } from '../types';
import ProjectTeamTab from '../components/ProjectTeamTab';
import ProjectFilesTab from '../components/ProjectFilesTab';
import ProjectTasksTab from '../components/ProjectTasksTab';
import ReactMarkdown from 'react-markdown';
import { alpha } from '@mui/material/styles';
import { LocationOn as LocationIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import HebrewMarkdown from '../components/CustomMarkdown';
import VisualizationRenderer from '../components/VisualizationRenderer';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `project-tab-${index}`,
    'aria-controls': `project-tabpanel-${index}`,
  };
}

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [statusMenuAnchorEl, setStatusMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isStatusMenuOpen = Boolean(statusMenuAnchorEl);
  const [visualizations, setVisualizations] = useState<Visualization[] | null>(null);
  const [visualizationsLoading, setVisualizationsLoading] = useState(false);
  const [visualizationsError, setVisualizationsError] = useState<string | null>(null);
  const [visualizationsLastFetched, setVisualizationsLastFetched] = useState<number | null>(null);

  // Load project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const projectResponse = await getProject(id);
        if (projectResponse.error) {
          setError(projectResponse.error);
          return;
        }

        if (projectResponse.data) {
          setProject(projectResponse.data);
        } else {
          setError('No project data found');
          return;
        }

        // Load messages
        const messagesResponse = await getProjectMessages(id);
        if (messagesResponse.error) {
          setError(messagesResponse.error);
          return;
        }

        // Sort messages by creation date to ensure correct order (oldest first)
        const sortedMessages = messagesResponse.data?.messages || [];
        sortedMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        setMessages(sortedMessages);
      } catch (err) {
        setError('Failed to load project data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // Scroll to bottom of messages when new messages arrive or on load
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to check if visualization cache is valid
  const isVisualizationCacheValid = useCallback(() => {
    if (!id) return false;
    
    try {
      // Get visualization cache data from localStorage
      const cacheKey = `visualizations_${id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) return false;
      
      const cache = JSON.parse(cachedData);
      const now = Date.now();
      const cacheAge = now - cache.timestamp;
      
      // Cache is valid if less than 24 hours old
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const isValid = cacheAge < twentyFourHours;
      
      if (isValid) {
        console.log('Using cached visualizations, age:', Math.round(cacheAge / (60 * 60 * 1000)), 'hours');
        return true;
      } else {
        console.log('Visualization cache expired:', Math.round(cacheAge / (60 * 60 * 1000)), 'hours old');
        return false;
      }
    } catch (err) {
      console.error('Error checking visualization cache:', err);
      return false;
    }
  }, [id]);
  
  // Function to load visualizations from cache
  const loadVisualizationsFromCache = useCallback(() => {
    if (!id) return null;
    
    try {
      const cacheKey = `visualizations_${id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const cache = JSON.parse(cachedData);
      setVisualizationsLastFetched(cache.timestamp);
      return cache.data;
    } catch (err) {
      console.error('Error loading visualizations from cache:', err);
      return null;
    }
  }, [id]);
  
  // Function to save visualizations to cache
  const saveVisualizationsToCache = useCallback((data: Visualization[]) => {
    if (!id) return;
    
    try {
      const cacheKey = `visualizations_${id}`;
      const now = Date.now();
      
      const cacheData = {
        timestamp: now,
        data: data
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      setVisualizationsLastFetched(now);
      console.log('Visualizations saved to cache');
    } catch (err) {
      console.error('Error saving visualizations to cache:', err);
    }
  }, [id]);
  
  // Fetch visualizations function with caching
  const fetchVisualizations = useCallback(async (forceRefresh = false) => {
    if (!id) return;
    
    // If not forcing refresh and already loading, don't do anything
    if (!forceRefresh && visualizationsLoading) return;
    
    // If not forcing refresh and cache is valid, load from cache
    if (!forceRefresh && isVisualizationCacheValid()) {
      const cachedData = loadVisualizationsFromCache();
      if (cachedData) {
        setVisualizations(cachedData);
        return;
      }
    }
    
    // Otherwise fetch from API
    setVisualizationsLoading(true);
    setVisualizationsError(null);
    
    try {
      const response = await getSuggestedVisualizations(id);
      
      if (response.error) {
        setVisualizationsError(response.error);
        setVisualizations(null);
      } else if (response.data) {
        setVisualizations(response.data.visualizations);
        // Save to cache
        saveVisualizationsToCache(response.data.visualizations);
      } else {
        setVisualizations([]);
      }
    } catch (err) {
      console.error('Failed to fetch visualizations:', err);
      setVisualizationsError('שגיאה בטעינת הניתוחים הגרפיים.');
      setVisualizations(null);
    } finally {
      setVisualizationsLoading(false);
    }
  }, [id, visualizationsLoading, isVisualizationCacheValid, loadVisualizationsFromCache, saveVisualizationsToCache]);
  
  // Trigger visualization fetch when tab changes to analysis
  useEffect(() => {
    if (activeTab === 2) {
      // Attempt to load from cache or fetch new data if needed
      fetchVisualizations(false);
    }
  }, [activeTab, fetchVisualizations]);

  const handleSendMessage = async () => {
    if (!id || (!newMessage.trim() && selectedFileIds.length === 0)) return;

    setSending(true);
    setError(null);

    try {
      // Add optimistic message to UI for better user experience
      let messageContent = newMessage.trim();
      
      // Add file references to the message if files are selected
      if (selectedFileIds.length > 0) {
        if (messageContent) {
          messageContent += '\n\n';
        }
        messageContent += 'קבצים מצורפים:\n' + 
          selectedFileNames.map((name, index) => `${index + 1}. ${name}`).join('\n');
      }
      
      const optimisticMessage: AssistantMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: messageContent,
        createdAt: new Date().toISOString(),
        citations: []
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      setNewMessage('');
      
      // Send the message with file IDs
      const response = await sendProjectMessage(
        id, 
        messageContent, 
        selectedFileIds.length > 0 ? selectedFileIds : undefined
      );
      
      // Clear selected files after sending
      setSelectedFileIds([]);
      setSelectedFileNames([]);
      
      if (response.error) {
        setError(response.error);
        // Remove optimistic message if there was an error
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== optimisticMessage.id));
        return;
      }
      
      // Refresh messages
      const messagesResponse = await getProjectMessages(id);
      if (messagesResponse.data?.messages) {
        // Sort messages by creation date
        const sortedMessages = messagesResponse.data.messages;
        sortedMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        setMessages(sortedMessages);
      }
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Render citation content
  const renderCitation = (citation: MessageCitation) => {
    return (
      <Chip
        key={citation.index}
        label={`[${citation.index}] ${citation.quote ? `"${citation.quote.substring(0, 30)}..."` : 'הפניה לקובץ'}`}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ margin: 0.5 }}
      />
    );
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // When switching to the chat tab, scroll to the bottom of messages
    if (newValue === 0) {
      // Use setTimeout to ensure the DOM has updated after the tab change
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Refresh project data after user updates
  const handleProjectUpdated = async () => {
    if (!id) return;
    
    try {
      const projectResponse = await getProject(id);
      if (projectResponse.data) {
        setProject(projectResponse.data);
      }
    } catch (err) {
      console.error('Failed to refresh project data', err);
    }
  };

  // Handle sending a file to chat from the Files tab
  const handleSendFileToChat = (fileId: string, fileName: string) => {
    setSelectedFileIds([fileId]);
    setSelectedFileNames([fileName]);
    setActiveTab(0); // Switch to chat tab
  };

  // Handle opening the status menu
  const handleStatusClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setStatusMenuAnchorEl(event.currentTarget);
  };

  // Handle closing the status menu
  const handleStatusMenuClose = () => {
    setStatusMenuAnchorEl(null);
  };

  // Handle changing the project status
  const handleStatusChange = async (newStatus: string) => {
    if (!id || !project) return;
    
    try {
      // Optimistically update UI
      setProject({
        ...project,
        status: newStatus
      });
      
      // Make API call to update project
      const response = await updateProject(id, { status: newStatus });
      
      // Handle error response
      if (response.error) {
        console.error('Failed to update project status:', response.error);
        // Revert to previous status in case of error
        setProject(project);
        return;
      }
      
      // Close the menu
      handleStatusMenuClose();
      
      // Optionally refresh project data to ensure it's up to date
      await handleProjectUpdated();
    } catch (err) {
      console.error('Failed to update project status:', err);
      // Revert to previous status in case of error
      if (project) {
        setProject({
          ...project,
          status: project.status
        });
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Container sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography>טוען נתוני פרויקט...</Typography>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container sx={{ mt: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')}>
            חזרה לרשימת הפרויקטים
          </Button>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth={false} sx={{ mt: 1, mb: 4, direction: 'rtl', px: { xs: 2, md: 3, lg: 4 } }}>
        {/* Project Header with Details */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 0, 
            mb: 3, 
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          {/* Colored Header Bar */}
          <Box sx={{ 
            p: 3, 
            background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            display: 'flex', 
            alignItems: 'center', 
            color: 'white',
            position: 'relative'
          }}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => navigate('/projects')}
              startIcon={<ArrowBackIcon />}
              sx={{
                ml: 2,
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                }
              }}
            >
              חזרה לפרוייקטים
            </Button>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
            {project?.name || 'פרויקט'}
          </Typography>
            
            {/* Clickable Status chip in header */}
            <Chip 
              label={project?.status === 'active' ? 'פעיל' : 
                     project?.status === 'completed' ? 'הושלם' : 
                     project?.status === 'pending' ? 'ממתין' : 
                     project?.status === 'onHold' ? 'בהמתנה' : project?.status}
              color={
                project?.status === 'active' ? 'success' : 
                project?.status === 'completed' ? 'primary' : 
                project?.status === 'pending' ? 'warning' : 
                project?.status === 'onHold' ? 'default' : 'default'
              }
              onClick={handleStatusClick}
              size="small"
              sx={{ 
                mr: 'auto', 
                fontWeight: 600, 
                bgcolor: project?.status === 'active' ? 'success.main' : 
                         project?.status === 'completed' ? 'primary.main' : 
                         project?.status === 'pending' ? 'warning.main' : 
                         'default',
                color: 'white',
                '& .MuiChip-label': {
                  px: 1.5
                },
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.9,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                }
              }}
            />
            
            {/* Status Menu */}
            <Menu
              id="status-menu"
              anchorEl={statusMenuAnchorEl}
              open={isStatusMenuOpen}
              onClose={handleStatusMenuClose}
              MenuListProps={{
                sx: { width: 160, p: 0.5, textAlign: 'right', direction: 'rtl' },
                'aria-labelledby': 'status-button',
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: { direction: 'rtl' }
              }}
            >
              <MenuItem 
                onClick={() => handleStatusChange('active')}
                selected={project?.status === 'active'}
                sx={{ 
                  borderRight: 'none',
                  borderLeft: project?.status === 'active' ? `4px solid ${theme.palette.success.main}` : 'none',
                  pl: project?.status === 'active' ? 1 : 2, 
                  py: 1,
                  direction: 'rtl',
                  textAlign: 'right'
                }}
              >
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.success.main,
                  ml: 1.5 
                }} />
                פעיל
              </MenuItem>
              <MenuItem 
                onClick={() => handleStatusChange('pending')}
                selected={project?.status === 'pending'}
                sx={{ 
                  borderRight: 'none',
                  borderLeft: project?.status === 'pending' ? `4px solid ${theme.palette.warning.main}` : 'none',
                  pl: project?.status === 'pending' ? 1 : 2, 
                  py: 1,
                  direction: 'rtl',
                  textAlign: 'right'
                }}
              >
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.warning.main,
                  ml: 1.5 
                }} />
                ממתין
              </MenuItem>
              <MenuItem 
                onClick={() => handleStatusChange('completed')}
                selected={project?.status === 'completed'}
                sx={{ 
                  borderRight: 'none',
                  borderLeft: project?.status === 'completed' ? `4px solid ${theme.palette.primary.main}` : 'none',
                  pl: project?.status === 'completed' ? 1 : 2, 
                  py: 1,
                  direction: 'rtl',
                  textAlign: 'right'
                }}
              >
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.primary.main,
                  ml: 1.5 
                }} />
                הושלם
              </MenuItem>
              <MenuItem 
                onClick={() => handleStatusChange('onHold')}
                selected={project?.status === 'onHold'}
                sx={{ 
                  borderRight: 'none',
                  borderLeft: project?.status === 'onHold' ? `4px solid ${theme.palette.grey[500]}` : 'none',
                  pl: project?.status === 'onHold' ? 1 : 2, 
                  py: 1,
                  direction: 'rtl',
                  textAlign: 'right'
                }}
              >
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.grey[500],
                  ml: 1.5 
                }} />
                בהמתנה
              </MenuItem>
            </Menu>
          </Box>
          
          {/* Project Details Section */}
          <Box sx={{ p: 3, bgcolor: theme.palette.background.paper, textAlign: 'right' }}>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                justifyItems: 'start'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                <Box 
                  sx={{ 
                    borderRadius: '50%', 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    p: 1, 
                    ml: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <LocationIcon color="primary" />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>כתובת</Typography>
                  <Typography variant="body1" fontWeight={500}>{project?.address}, {project?.city}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                <Box 
                  sx={{ 
                    borderRadius: '50%', 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    p: 1, 
                    ml: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <InfoIcon color="primary" />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>סוג פרויקט</Typography>
                  <Typography variant="body1" fontWeight={500}>{project?.type}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                <Box 
                  sx={{ 
                    borderRadius: '50%', 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    p: 1, 
                    ml: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CalendarIcon color="primary" />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>תאריך התחלה</Typography>
                  <Typography variant="body1" fontWeight={500}>{new Date(project?.startDate || '').toLocaleDateString('he-IL')}</Typography>
                </Box>
              </Box>
        </Box>

            {project?.description && (
              <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`, textAlign: 'right' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>תיאור</Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6, color: alpha(theme.palette.text.primary, 0.9) }}>
                  {project.description}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Tabs Container - Widened */}
        <Box 
          sx={{ 
            width: '100%', 
            mb: 3, 
            bgcolor: theme.palette.background.paper,
            borderRadius: 3,
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}
        >
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="project tabs"
              textColor="primary"
              indicatorColor="primary"
            variant="fullWidth"
            sx={{ 
              direction: 'rtl',
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTabs-flexContainer': {
                flexDirection: 'row'
              },
              '& .MuiTabs-indicator': { 
                transition: 'right 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3
              },
              '& .MuiTab-root': {
                fontSize: '0.9rem',
                fontWeight: 600,
                minHeight: 64,
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                },
              },
              '& .Mui-selected': {
                fontWeight: 700,
              }
            }}
            >
              <Tab 
                label="צ'אט" 
                icon={<ChatIcon />} 
                iconPosition="start" 
                {...a11yProps(0)} 
              />
              <Tab 
                label="קבצים" 
                icon={<FilesIcon />} 
                iconPosition="start" 
                {...a11yProps(1)} 
              />
              <Tab 
                label="ניתוח גרפי" 
                icon={<AnalyticsIcon />}
                iconPosition="start" 
                {...a11yProps(2)} 
              />
              <Tab 
              label="צוות" 
              icon={<PeopleIcon />} 
                iconPosition="start" 
                {...a11yProps(3)} 
              />
              <Tab 
                label="משימות" 
                icon={<TasksIcon />} 
                iconPosition="start" 
              {...a11yProps(4)} 
              />
            </Tabs>
          
          {/* Chat Tab Panel */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ px: { xs: 1, sm: 2 }, py: 1 }}>
            {/* Chat Interface */}
              <Box sx={{ 
                height: 'calc(100vh - 320px)', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.4)
              }}>
              {/* Messages Container */}
              <Paper 
                  elevation={0} 
                sx={{ 
                  flexGrow: 1, 
                  mb: 2, 
                    p: { xs: 2, md: 3 }, 
                    maxHeight: 'calc(100vh - 400px)', 
                  overflow: 'auto',
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    borderRadius: 2
                }}
                ref={messagesContainerRef}
              >
                  <List sx={{ py: 0 }}>
                  {messages.map((message, index) => (
                    <React.Fragment key={message.id}>
                        <ListItem 
                          disablePadding
                          sx={{
                            display: 'flex',
                        flexDirection: 'column', 
                            alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: 1.5,
                            paddingLeft: 0,
                            paddingRight: 0
                          }}
                        >
                          <Box 
                            sx={{
                              maxWidth: '85%',
                          backgroundColor: message.role === 'user' 
                            ? theme.palette.primary.main 
                                : message.role === 'assistant' 
                                  ? theme.palette.secondary.main 
                                  : theme.palette.grey[300],
                              color: message.role === 'user' || message.role === 'assistant' 
                                ? '#fff' 
                                : theme.palette.text.primary,
                          padding: 2,
                              borderRadius: message.role === 'user' 
                                ? '16px 16px 0 16px' 
                                : '16px 16px 16px 0',
                          whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {message.role === 'assistant' ? (
                              <HebrewMarkdown 
                                content={message.content} 
                                color="#fff" 
                              />
                            ) : (
                              <Typography variant="body1" sx={{ direction: 'rtl', textAlign: 'right' }}> 
                            {message.content}
                          </Typography>
                            )}
                        </Box>
                        
                        {/* Display Citations if any */}
                        {message.citations && message.citations.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                            {message.citations.map(citation => renderCitation(citation))}
                          </Box>
                        )}
                        
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mt: 0.5, 
                              color: alpha(theme.palette.text.secondary, 0.8),
                              fontSize: '0.7rem'
                            }}
                          >
                          {new Date(message.createdAt).toLocaleTimeString('he-IL', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false
                          })}
                        </Typography>
                      </ListItem>
                        {index < messages.length - 1 && 
                          <Box 
                            component="div" 
                            sx={{ 
                              width: '100%', 
                              height: '1px', 
                              bgcolor: alpha(theme.palette.divider, 0.08), 
                              my: 1.5 
                            }} 
                          />
                        }
                    </React.Fragment>
                  ))}
                  <div ref={messagesEndRef} />
                </List>
              </Paper>
              
              {/* Message Input */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1, 
                    p: 2, 
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: '0 0 8px 8px'
                  }}
                >
                {/* Selected Files */}
                {selectedFileIds.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {selectedFileNames.map((name, index) => (
                      <Chip
                        key={index}
                        label={name}
                        color="primary"
                        variant="outlined"
                        onDelete={() => {
                          setSelectedFileIds(prev => prev.filter((_, i) => i !== index));
                          setSelectedFileNames(prev => prev.filter((_, i) => i !== index));
                        }}
                        size="small"
                          sx={{
                            borderRadius: '12px',
                            '& .MuiChip-deleteIcon': {
                              margin: '0 2px 0 -6px',
                            }
                          }}
                      />
                    ))}
                  </Box>
                )}
                
                {/* Text input and send button */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '24px', 
                    px: 1.5,
                    py: 1
                  }}>
                    <IconButton 
                      color="primary" 
                      onClick={handleSendMessage} 
                      disabled={(selectedFileIds.length === 0 && !newMessage.trim()) || sending}
                      sx={{ 
                        width: 50, 
                        height: 50,
                        flexShrink: 0,
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        boxShadow: 1,
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark,
                          transform: 'scale(1.05)',
                        },
                        '&.Mui-disabled': {
                          bgcolor: alpha(theme.palette.primary.main, 0.5),
                          color: 'white'
                        }
                      }}
                    >
                      {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(180deg)', fontSize: 26 }} />}
                    </IconButton>
                    
                  <TextField
                    fullWidth
                    placeholder={selectedFileIds.length > 0 
                      ? "הוסף הערה לקבצים או לחץ על שלח" 
                      : "הקלד הודעה..."}
                    multiline
                    maxRows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    variant="outlined"
                      inputProps={{
                        style: { 
                          direction: 'rtl', 
                          textAlign: 'right'
                        }
                      }}
                      sx={{ 
                        flex: 1,
                        ml: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '24px',
                          padding: '10px 16px',
                          backgroundColor: alpha(theme.palette.background.default, 0.8),
                          '&:hover': {
                            backgroundColor: theme.palette.background.default
                          },
                          '&.Mui-focused': {
                            backgroundColor: theme.palette.background.default
                          }
                        },
                        '& .MuiInputBase-input': {
                          direction: 'rtl',
                          textAlign: 'right'
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </TabPanel>
          
          {/* Other Tab Panels with similar styling */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {project && (
              <ProjectFilesTab 
                project={project} 
                onProjectUpdated={handleProjectUpdated} 
                onSendFileToChat={handleSendFileToChat}
              />
            )}
            </Box>
          </TabPanel>
          
          {/* Empty Analysis Tab Panel */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">ניתוח גרפי</Typography>
                
                {/* Last updated time and refresh button */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {visualizationsLastFetched && (
                    <Typography variant="caption" sx={{ mr: 1, color: 'text.secondary' }}>
                      עודכן לאחרונה: {new Date(visualizationsLastFetched).toLocaleString('he-IL')}
                    </Typography>
                  )}
                  <Tooltip title="רענן נתונים">
                    <IconButton 
                      onClick={() => fetchVisualizations(true)} 
                      disabled={visualizationsLoading}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      {visualizationsLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <RefreshIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              {visualizationsLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>טוען הצעות לתצוגה...</Typography>
                </Box>
              )}
              
              {visualizationsError && (
                <Typography color="error" sx={{ my: 2 }}>
                  שגיאה: {visualizationsError}
                </Typography>
              )}
              
              {!visualizationsLoading && !visualizationsError && visualizations && (
                <Box>
                  {visualizations.length === 0 ? (
                    <Typography>לא נמצאו הצעות לתצוגות חזותיות עבור פרויקט זה.</Typography>
                  ) : (
                    visualizations.map((viz, index) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>{viz.title}</Typography>
                          <Chip label={viz.type} size="small" sx={{ mb: 1 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{viz.description}</Typography>
                          {/* Render actual chart/table based on viz.type */}
                          <VisualizationRenderer visualization={viz} />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
              {project && <ProjectTeamTab project={project} onProjectUpdated={handleProjectUpdated} />}
                </Box>
          </TabPanel>
          
          <TabPanel value={activeTab} index={4}>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {project && <ProjectTasksTab project={project} onProjectUpdated={handleProjectUpdated} />}
            </Box>
          </TabPanel>
        </Box>
      </Container>
    </MainLayout>
  );
};

export default ProjectPage; 