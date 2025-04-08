import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  Grid as MuiGrid,
  Chip,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Skeleton,
  useTheme,
  alpha,
  Tabs,
  Tab,
  CardHeader,
  Avatar,
  Tooltip,
  GridProps,
  styled
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Sort as SortIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  ConstructionOutlined as ConstructionIcon,
  BusinessOutlined as BusinessIcon,
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { getAllProjects } from '../services/api';
import { Project } from '../types';

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

// Status chip color mapping
const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  active: 'success',
  pending: 'warning',
  completed: 'primary',
  cancelled: 'error',
  onHold: 'default',
};

// Filter interface for type safety
interface Filters {
  status: string | null;
  clientId: string | null;
  search: string;
}

// Sort options
type SortOption = {
  field: keyof Project | 'location';
  label: string;
  direction: 'asc' | 'desc';
};

const ProjectsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sorting state
  const [filters, setFilters] = useState<Filters>({
    status: null,
    clientId: null,
    search: '',
  });
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'createdAt',
    label: 'תאריך יצירה',
    direction: 'desc'
  });
  
  // UI state
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusTab, setStatusTab] = useState<string | null>(null);

  // Define fetchProjects using useCallback to memoize it
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Only pass non-empty filters to the API
      const apiFilters: Record<string, string> = {};
      if (filters.status) apiFilters.status = filters.status;
      if (filters.clientId) apiFilters.clientId = filters.clientId;
      if (filters.search) apiFilters.search = filters.search;
      
      const response = await getAllProjects(apiFilters);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setProjects(response.data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('אירעה שגיאה בטעינת הפרויקטים. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.clientId, filters.search]);

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setFilters(prev => ({ ...prev, search: searchValue }));
  };

  // Delayed search to avoid too many API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProjects();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters.search, fetchProjects]);

  // Filter menu handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };

  // Sort menu handlers
  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };
  
  const handleSortClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortOptionSelect = (option: SortOption) => {
    setSortOption(option);
    setSortMenuAnchor(null);
  };

  // Handle status tab change
  const handleStatusTabChange = (_event: React.SyntheticEvent, newValue: string | null) => {
    setStatusTab(newValue);
    setFilters(prev => ({ ...prev, status: newValue }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: null,
      clientId: null,
      search: '',
    });
    setStatusTab(null);
  };
  
  // Navigate to project details page
  const navigateToProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };
  
  // Navigate to create project page
  const navigateToCreateProject = () => {
    navigate('/projects/create');
  };

  // Apply sorting to filtered projects
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // Special case for location field which is a composite
      if (sortOption.field === 'location') {
        aValue = `${a.city}, ${a.address}`;
        bValue = `${b.city}, ${b.address}`;
      } else {
        aValue = a[sortOption.field];
        bValue = b[sortOption.field];
      }
      
      // Handle dates
      if (sortOption.field === 'createdAt' || sortOption.field === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOption.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [projects, sortOption]);

  return (
    <MainLayout>
      <Container 
        maxWidth="xl" 
        sx={{ 
          mt: 4, 
          mb: 4, 
          direction: 'rtl', 
          textAlign: 'right',
          width: '100%',
          pr: 0, // Remove default padding in RTL
          pl: 0  // Remove default padding in RTL
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          px: 2 // Add explicit padding to the box instead
        }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            פרויקטים
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={navigateToCreateProject}
              sx={{ 
                borderRadius: 2,
                fontWeight: 'bold',
                boxShadow: 2,
              }}
            >
              פרויקט חדש
            </Button>
          </Box>
        </Box>
        
        {/* Filters and Search */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
            {/* Search input */}
            <TextField
              placeholder="חיפוש פרויקטים..."
              size="small"
              value={filters.search}
              onChange={handleSearchChange}
              sx={{ 
                flexGrow: 1,
                minWidth: { xs: '100%', sm: 250 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Filter button */}
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              sx={{ 
                borderRadius: 8,
              }}
            >
              סינון
            </Button>

            {/* Sort button */}
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<SortIcon />}
              onClick={handleSortClick}
              sx={{ 
                borderRadius: 8,
              }}
            >
              מיון: {sortOption.label}
            </Button>
            
            {/* Reset filters */}
            {(filters.status || filters.clientId || filters.search) && (
              <Tooltip title="איפוס כל הסינונים">
                <IconButton onClick={resetFilters} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          {/* Status tabs */}
          <Box sx={{ mt: 2 }}>
            <Tabs 
              value={statusTab} 
              onChange={handleStatusTabChange}
              indicatorColor="primary"
              textColor="primary"
              scrollButtons="auto"
              variant="scrollable"
              TabScrollButtonProps={{
                sx: { }
              }}
              sx={{ 
                minHeight: 48,
                '& .MuiTabs-indicator': { 
                  transition: 'right 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'
                },
                '& .MuiTabs-flexContainer': {
                  flexDirection: 'row'
                },
                '& .MuiTabs-scroller': {
                  overflow: 'auto !important'
                }
              }}
            >
              <Tab value={null} label="הכל" />
              <Tab value="active" label="פעיל" />
              <Tab value="pending" label="ממתין" />
              <Tab value="completed" label="הושלם" />
              <Tab value="onHold" label="בהמתנה" />
            </Tabs>
          </Box>
          
          {/* Filter menu */}
          <Menu
            anchorEl={filterMenuAnchor}
            open={Boolean(filterMenuAnchor)}
            onClose={handleFilterClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { 
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          >
            <MenuItem onClick={() => {
              setFilters(prev => ({ ...prev, status: 'active' }));
              setStatusTab('active');
              handleFilterClose();
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon color="success" sx={{ mr: 1 }} />
                פרויקטים פעילים
              </Box>
            </MenuItem>
            <MenuItem onClick={() => {
              setFilters(prev => ({ ...prev, status: 'completed' }));
              setStatusTab('completed');
              handleFilterClose();
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon color="primary" sx={{ mr: 1 }} />
                פרויקטים שהושלמו
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              setFilters(prev => ({ ...prev, status: null }));
              setStatusTab(null);
              handleFilterClose();
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ClearIcon sx={{ mr: 1 }} />
                איפוס סינון
              </Box>
            </MenuItem>
          </Menu>
          
          {/* Sort menu */}
          <Menu
            anchorEl={sortMenuAnchor}
            open={Boolean(sortMenuAnchor)}
            onClose={handleSortClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { 
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          >
            <MenuItem onClick={() => handleSortOptionSelect({
              field: 'name',
              label: 'שם פרויקט',
              direction: 'asc'
            })}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SortIcon sx={{ mr: 1 }} />
                שם פרויקט (א-ת)
              </Box>
            </MenuItem>
            <MenuItem onClick={() => handleSortOptionSelect({
              field: 'createdAt',
              label: 'תאריך יצירה',
              direction: 'desc'
            })}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1 }} />
                תאריך יצירה (חדש לישן)
              </Box>
            </MenuItem>
            <MenuItem onClick={() => handleSortOptionSelect({
              field: 'location',
              label: 'מיקום',
              direction: 'asc'
            })}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 1 }} />
                מיקום (א-ת)
              </Box>
            </MenuItem>
          </Menu>
        </Paper>
        
        {/* Error message */}
        {error && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              border: `1px solid ${theme.palette.error.main}`,
              borderRadius: 2
            }}
          >
            <Typography>{error}</Typography>
          </Paper>
        )}
        
        {/* Project cards */}
        <Grid 
          container 
          spacing={3} 
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            width: '100%',
            mx: 'auto', // Center the grid container
            direction: 'rtl',
            justifyContent: 'flex-start', // Start from right in RTL
          }}
        >
          {loading ? (
            // Skeleton loading state
            Array.from(new Array(6)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: 2,
                  boxShadow: 1,
                  transition: 'all 0.3s ease',
                  textAlign: 'right',
                  direction: 'rtl',
                }}>
                  <CardContent>
                    <Skeleton variant="text" height={40} width="60%" />
                    <Skeleton variant="text" height={25} width="40%" />
                    <Box sx={{ mt: 2 }}>
                      <Skeleton variant="text" height={20} />
                      <Skeleton variant="text" height={20} />
                    </Box>
                    <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
                      <Skeleton variant="rectangular" height={32} width={80} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : sortedProjects.length > 0 ? (
            sortedProjects.map((project) => (
              <Grid item xs={12} sm={6} md={6} lg={4} key={project.id}>
                <Card sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%', 
                  minHeight: 300,
                  borderRadius: 2,
                  boxShadow: 1,
                  transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-5px)'
                  },
                  textAlign: 'right',
                  direction: 'rtl',
                  overflow: 'hidden',
                }}>
                  <CardActionArea
                    onClick={() => navigateToProject(project.id)}
                    sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'flex-start', // Align to right in RTL
                    }}
                  >
                    <CardContent sx={{ 
                      width: '100%', 
                      p: 2.5, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      flexGrow: 1,
                      direction: 'rtl',
                      textAlign: 'right',
                      '& > *': {
                        direction: 'rtl',
                        textAlign: 'right',
                        width: '100%'
                      },
                      '& p, & span, & div': {
                        textAlign: 'right',
                        direction: 'rtl',
                        display: 'block',
                        width: '100%'
                      }
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 1.5, 
                        direction: 'rtl',
                        width: '100%',
                      }}>
                        <Typography variant="h6" component="div" fontWeight="600" sx={{ 
                          maxWidth: 'calc(100% - 90px)',
                          direction: 'rtl',
                          textAlign: 'right',
                          paddingLeft: 2,
                          paddingRight: 0
                        }}>
                          {project.name}
                        </Typography>
                        <Chip
                          label={project.status === 'active' ? 'פעיל' : 
                                 project.status === 'completed' ? 'הושלם' : 
                                 project.status === 'pending' ? 'ממתין' : 
                                 project.status === 'onHold' ? 'בהמתנה' : project.status}
                          color={statusColors[project.status] || 'default'}
                          size="small"
                          sx={{ 
                            height: 24, 
                            fontSize: '0.75rem', 
                            fontWeight: 500,
                            width: 'auto',
                            minWidth: '60px',
                            '& .MuiChip-label': {
                              textAlign: 'center !important',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: '100%',
                              padding: '0 8px',
                              margin: '0 auto'
                            }
                          }}
                        />
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ mb: 1.5, direction: 'rtl', width: '100%' }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mb: 1, 
                          direction: 'rtl',
                          width: '100%',
                          '& > svg': { 
                            marginLeft: 1.5, 
                            marginRight: 0,
                            flexShrink: 0
                          }
                        }}>
                          {project.type === 'בנייה חדשה' 
                            ? <ConstructionIcon sx={{ color: 'action.active' }} /> 
                            : <BusinessIcon sx={{ color: 'action.active' }} />}
                          <Typography variant="body2" color="text.secondary">
                            {project.type}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mb: 1, 
                          direction: 'rtl',
                          width: '100%',
                          '& > svg': { 
                            marginLeft: 1.5, 
                            marginRight: 0,
                            flexShrink: 0
                          }
                        }}>
                          <LocationIcon sx={{ color: 'action.active' }} />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {project.city}, {project.address}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          direction: 'rtl',
                          width: '100%',
                          '& > svg': { 
                            marginLeft: 1.5, 
                            marginRight: 0,
                            flexShrink: 0
                          }
                        }}>
                          <CalendarIcon sx={{ color: 'action.active' }} />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {new Date(project.startDate).toLocaleDateString('he-IL')} 
                            {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('he-IL')}`}
                          </Typography>
                        </Box>
                      </Box>

                      {project.description && (
                        <>
                          <Divider sx={{ my: 1.5 }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              flexGrow: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'block',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.5,
                              direction: 'rtl',
                              textAlign: 'right',
                              width: '100%',
                              mr: 0,
                              pr: 0,
                              position: 'relative',
                              '&::after': {
                                content: '""',
                                display: 'table',
                                clear: 'both'
                              }
                            }}
                          >
                            {project.description}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Box sx={{ width: '100%', mt: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                לא נמצאו פרויקטים
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                נסה לשנות את הגדרות הסינון או ליצור פרויקט חדש
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />} 
                onClick={navigateToCreateProject}
                sx={{ 
                  mt: 3,
                }}
              >
                צור פרויקט חדש
              </Button>
            </Box>
          )}
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default ProjectsPage; 