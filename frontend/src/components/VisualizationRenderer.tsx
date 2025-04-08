import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Divider,
  Tooltip,
  IconButton,
  Grid,
  Fade,
  alpha,
} from '@mui/material';
import {
  BarChart,
  PieChart,
  LineChart,
  BarPlot,
  LinePlot,
  PiePlot,
  ChartsLegend,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  ChartsAxisHighlight,
} from '@mui/x-charts';
import InfoIcon from '@mui/icons-material/Info';
import { Visualization, ChartData, TableData } from '../types';

// Helper function to check if data is ChartData
function isChartData(data: ChartData | TableData): data is ChartData {
  return (data as ChartData).labels !== undefined && (data as ChartData).datasets !== undefined;
}

// Error boundary as a function component using useState and useEffect
function SafeChart({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state on new children prop
    setHasError(false);
  }, [children]);

  // If there was an error, show a fallback UI
  if (hasError) {
    return (
      <Alert severity="error" sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Failed to render chart. Please try refreshing the page.
      </Alert>
    );
  }

  // Wrap in error boundary div that catches errors during rendering
  return (
    <div
      onError={(e) => {
        e.preventDefault();
        setHasError(true);
      }}
    >
      {children}
    </div>
  );
}

// Generate a custom color palette based on the theme
const generateChartPalette = (theme: any) => {
  return [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.success.light,
    theme.palette.warning.light,
  ];
};

const VisualizationRenderer: React.FC<{ visualization: Visualization }> = ({ visualization }) => {
  const theme = useTheme();
  const [chartError, setChartError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simulate a small loading delay for smooth transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const customPalette = generateChartPalette(theme);

  const renderPieChart = (data: ChartData) => {
    try {
      if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
        return <Alert severity="warning">חסרים נתונים לתצוגת הגרף</Alert>;
      }
      
      // Format data for MUI X PieChart
      const dataset = data.datasets[0];
      const series = [{
        data: dataset.data.map((value, index) => ({
          id: index,
          value,
          label: data.labels[index],
        })),
        highlightScope: { 
          faded: 'global' as const, 
          highlighted: 'item' as const 
        },
        faded: { innerRadius: 30, color: 'gray', opacity: 0.3 },
        arcLabel: (item: { value: number }) => `${item.value.toLocaleString()}`,
        arcLabelMinAngle: 45,
      }];

      return (
        <Fade in={isLoaded} timeout={500}>
          <Box sx={{ height: 300, width: '100%' }}>
            <PieChart
              series={series}
              width={500}
              height={300}
              margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
              colors={dataset.backgroundColor || customPalette}
              sx={{
                '.MuiChartsLegend-mark': {
                  rx: '50%', // rounded marker
                  ry: '50%',
                },
                '.MuiChartsLegend-root': {
                  direction: 'rtl', // RTL for Hebrew
                },
                '.MuiChartsLegend-label': {
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 12,
                },
                '.MuiChartsLegend-series': {
                  flexDirection: 'row-reverse',
                  gap: 1,
                },
              }}
            >
              <ChartsLegend 
                position={{ vertical: 'top', horizontal: 'right' }} 
                slotProps={{
                  legend: {
                    direction: 'row',
                    position: { vertical: 'top', horizontal: 'right' },
                    padding: { top: 0, bottom: 0, left: 0, right: 0 },
                    itemMarkWidth: 10,
                    itemMarkHeight: 10,
                    markGap: 5,
                    itemGap: 10,
                  }
                }}
              />
              <ChartsTooltip 
                trigger="item"
                slotProps={{
                  popper: {
                    sx: { 
                      fontFamily: theme.typography.fontFamily,
                      direction: 'rtl', // RTL for Hebrew
                      '& .MuiTooltip-tooltip': {
                        fontFamily: theme.typography.fontFamily,
                      },
                    }
                  }
                }}
              />
            </PieChart>
          </Box>
        </Fade>
      );
    } catch (error) {
      console.error('Error rendering pie chart:', error);
      return <Alert severity="error">שגיאה בטעינת גרף העוגה</Alert>;
    }
  };

  const renderBarChart = (data: ChartData) => {
    try {
      if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
        return <Alert severity="warning">חסרים נתונים לתצוגת הגרף</Alert>;
      }

      // Format data for MUI X BarChart
      const dataset = data.datasets[0];
      const series = [{
        data: dataset.data,
        label: dataset.label,
        color: theme.palette.primary.main,
        valueFormatter: (value: number | null) => value !== null ? value.toLocaleString() : 'N/A',
      }];

      return (
        <Fade in={isLoaded} timeout={500}>
          <Box sx={{ height: 300, width: '100%' }}>
            <BarChart
              dataset={data.labels.map((label, index) => ({
                x: label,
                y: dataset.data[index],
              }))}
              xAxis={[{
                scaleType: 'band',
                dataKey: 'x',
                tickLabelStyle: {
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 12,
                  direction: 'rtl', // RTL for Hebrew
                  angle: data.labels.length > 5 ? -45 : 0,
                  textAnchor: data.labels.length > 5 ? 'end' : 'middle',
                },
              }]}
              yAxis={[{
                tickLabelStyle: {
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 12,
                },
              }]}
              series={[{
                dataKey: 'y',
                label: dataset.label,
                valueFormatter: (value: number | null) => 
                  value !== null ? value.toLocaleString() : 'N/A',
                color: dataset.backgroundColor ? 
                  (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) : 
                  theme.palette.primary.main,
              }]}
              margin={{ top: 20, bottom: data.labels.length > 5 ? 60 : 30, left: 40, right: 10 }}
              sx={{
                '.MuiChartsAxis-tickLabel': {
                  fontFamily: theme.typography.fontFamily,
                },
                '.MuiChartsAxis-tick': {
                  stroke: theme.palette.divider,
                },
                '.MuiChartsAxis-line': {
                  stroke: theme.palette.divider,
                },
                '.MuiBarElement-root:hover': {
                  filter: 'brightness(0.9)',
                },
              }}
            >
              <ChartsTooltip 
                slotProps={{
                  popper: {
                    sx: { 
                      fontFamily: theme.typography.fontFamily,
                      direction: 'rtl', // RTL for Hebrew
                      '& .MuiTooltip-tooltip': {
                        fontFamily: theme.typography.fontFamily,
                      },
                    }
                  }
                }}
              />
              <ChartsAxisHighlight x="line" />
            </BarChart>
          </Box>
        </Fade>
      );
    } catch (error) {
      console.error('Error rendering bar chart:', error);
      return <Alert severity="error">שגיאה בטעינת גרף העמודות</Alert>;
    }
  };

  const renderLineChart = (data: ChartData) => {
    try {
      if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
        return <Alert severity="warning">חסרים נתונים לתצוגת הגרף</Alert>;
      }

      // Format data for MUI X LineChart
      const formattedData = data.labels.map((label, index) => {
        const point: any = { x: label };
        data.datasets.forEach((dataset, datasetIndex) => {
          point[`y${datasetIndex}`] = dataset.data[index];
        });
        return point;
      });

      return (
        <Fade in={isLoaded} timeout={500}>
          <Box sx={{ height: 300, width: '100%' }}>
            <LineChart
              dataset={formattedData}
              margin={{ top: 20, bottom: data.labels.length > 5 ? 60 : 30, left: 40, right: 20 }}
              xAxis={[{
                scaleType: 'point',
                dataKey: 'x',
                tickLabelStyle: {
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 12,
                  direction: 'rtl', // RTL for Hebrew
                  angle: data.labels.length > 5 ? -45 : 0,
                  textAnchor: data.labels.length > 5 ? 'end' : 'middle',
                },
              }]}
              yAxis={[{
                tickLabelStyle: {
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 12,
                },
              }]}
              series={
                data.datasets.map((dataset, index) => ({
                  dataKey: `y${index}`,
                  label: dataset.label,
                  valueFormatter: (value: number | null) => 
                    value !== null ? value.toLocaleString() : 'N/A',
                  color: dataset.borderColor || 
                    (Array.isArray(customPalette) ? 
                      customPalette[index % customPalette.length] : 
                      theme.palette.primary.main),
                  showMark: data.labels.length < 10,
                  area: true,
                  stack: data.datasets.length > 1 ? 'total' : undefined,
                  curve: "natural",
                }))
              }
              sx={{
                '.MuiChartsAxis-tickLabel': {
                  fontFamily: theme.typography.fontFamily,
                },
                '.MuiChartsAxis-tick': {
                  stroke: theme.palette.divider,
                },
                '.MuiChartsAxis-line': {
                  stroke: theme.palette.divider,
                },
              }}
            >
              <ChartsTooltip 
                slotProps={{
                  popper: {
                    sx: { 
                      fontFamily: theme.typography.fontFamily,
                      direction: 'rtl', // RTL for Hebrew
                      '& .MuiTooltip-tooltip': {
                        fontFamily: theme.typography.fontFamily,
                      },
                    }
                  }
                }}
              />
              <ChartsLegend 
                position={{ vertical: 'top', horizontal: 'right' }} 
                slotProps={{
                  legend: {
                    direction: 'row',
                    position: { vertical: 'top', horizontal: 'right' },
                    padding: { top: 0, bottom: 0, left: 0, right: 0 },
                    itemMarkWidth: 10,
                    itemMarkHeight: 10,
                    markGap: 5,
                    itemGap: 10,
                  }
                }}
              />
              <ChartsAxisHighlight x="line" />
            </LineChart>
          </Box>
        </Fade>
      );
    } catch (error) {
      console.error('Error rendering line chart:', error);
      return <Alert severity="error">שגיאה בטעינת גרף הקו</Alert>;
    }
  };

  const renderChart = (data: ChartData) => {
    // Validate data before rendering to prevent runtime errors
    if (!data || !data.labels || !Array.isArray(data.labels) || !data.datasets || !Array.isArray(data.datasets)) {
      console.error("Invalid chart data:", data);
      return (
        <Alert severity="error">
          פורמט נתונים לא תקין לתצוגת גרף
        </Alert>
      );
    }

    try {
      switch(visualization.type) {
        case 'pie':
          return renderPieChart(data);
        case 'bar':
          return renderBarChart(data);
        case 'line':
          return renderLineChart(data);
        default:
          return (
            <Alert severity="warning">
              סוג הגרף '{visualization.type}' אינו נתמך
            </Alert>
          );
      }
    } catch (error) {
      console.error("Error rendering chart:", error);
      return (
        <Alert severity="error">
          שגיאה בהצגת הגרף
        </Alert>
      );
    }
  };

  const renderTable = (data: TableData) => {
    // Validate table data
    if (!data || !data.headers || !Array.isArray(data.headers) || !data.rows || !Array.isArray(data.rows)) {
      return (
        <Alert severity="error">
          פורמט נתונים לא תקין לתצוגת טבלה
        </Alert>
      );
    }

    return (
      <Fade in={isLoaded} timeout={500}>
        <TableContainer 
          component={Paper} 
          elevation={0} 
          variant="outlined" 
          sx={{ 
            direction: 'rtl',
            maxHeight: 300,
            borderRadius: 1,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          <Table size="small" aria-label={visualization.title} stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                {data.headers.map((header, index) => (
                  <TableCell 
                    key={index} 
                    align="right" 
                    sx={{ 
                      fontWeight: 'bold', 
                      fontFamily: theme.typography.fontFamily,
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.text.primary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex} 
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.1) },
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.2) },
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <TableCell 
                      key={cellIndex} 
                      align="right" 
                      sx={{ 
                        fontFamily: theme.typography.fontFamily,
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                      }}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Fade>
    );
  };

  try {
    return (
      <Card 
        variant="outlined" 
        sx={{ 
          borderRadius: 2, 
          boxShadow: theme.shadows[1],
          transition: 'all 0.3s ease',
          height: '100%',
          '&:hover': {
            boxShadow: theme.shadows[4],
            borderColor: theme.palette.primary.main,
          }
        }}
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', direction: 'rtl' }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium', fontSize: '1rem' }}>
                {visualization.title}
              </Typography>
              <Tooltip title={visualization.description} placement="top">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
          sx={{ 
            pb: 0,
            direction: 'rtl',
            '& .MuiCardHeader-content': { overflow: 'hidden' },
            '& .MuiCardHeader-title': { 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }
          }}
        />
        <CardContent sx={{ pt: 1, pb: '16px !important' }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              direction: 'rtl',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: '32px' 
            }}
          >
            {visualization.description}
          </Typography>
          {!isLoaded ? (
            <Skeleton variant="rectangular" height={300} width="100%" animation="wave" />
          ) : (
            <SafeChart>
              {isChartData(visualization.data)
                ? renderChart(visualization.data)
                : renderTable(visualization.data)}
            </SafeChart>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("Error rendering visualization:", error);
    return (
      <Alert severity="error">
        שגיאה בהצגת הויזואליזציה. ייתכן שפורמט הנתונים אינו תקין.
      </Alert>
    );
  }
};

export default VisualizationRenderer; 