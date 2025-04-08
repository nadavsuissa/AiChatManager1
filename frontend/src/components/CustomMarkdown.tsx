import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Box } from '@mui/material';

// Inline styles for RTL content
const rtlStyles = `
/* RTL Markdown Styling */
.rtl-markdown-container {
  direction: rtl;
  text-align: right;
  display: block;
  width: 100%;
}

.rtl-markdown-container * {
  direction: rtl;
  text-align: right;
}

/* Make lists show with bullets on the right side */
.rtl-markdown-container ul {
  padding-right: 1.5em !important;
  padding-left: 0 !important;
  margin-right: 0 !important;
  margin-left: 0 !important;
  list-style-type: disc !important;
}

/* Special handling for list items */
.rtl-markdown-container li {
  display: list-item !important;
  text-align: right !important;
  /* Ensure bullets have correct color */
  color: inherit !important;
  list-style-type: disc !important;
}

/* Special styling for the bullet markers */
.rtl-markdown-container ul li::marker {
  color: inherit !important;
}

/* Paragraph spacing */
.rtl-markdown-container p {
  margin-bottom: 1em;
}
`;

// Simple function to convert bullet points to proper HTML lists
const formatHebrewBulletPoints = (content: string): string => {
  // If the content contains bullet points (•) convert them to HTML list
  if (content.includes('•')) {
    // Split the content by lines
    const lines = content.split('\n');
    let inList = false;
    const formattedLines = [];
    
    for (let line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this is a bullet point
      if (trimmedLine.startsWith('•')) {
        // If we're not already in a list, start a new list
        if (!inList) {
          formattedLines.push('<ul style="color: inherit; list-style-type: disc;">');
          inList = true;
        }
        
        // Create a list item, removing the bullet
        const itemContent = trimmedLine.substring(1).trim();
        formattedLines.push(`<li style="color: inherit; list-style-type: disc;">${itemContent}</li>`);
      } else {
        // If we were in a list, close it
        if (inList) {
          formattedLines.push('</ul>');
          inList = false;
        }
        
        // Add the regular line
        formattedLines.push(line);
      }
    }
    
    // If we're still in a list at the end, close it
    if (inList) {
      formattedLines.push('</ul>');
    }
    
    return formattedLines.join('\n');
  }
  
  // If no bullet points, return the original content
  return content;
};

// Simplified RTL markdown component
const HebrewMarkdown: React.FC<{ content: string; color?: string }> = ({ 
  content, 
  color = 'inherit' 
}) => {
  // Inject the styles once when component mounts
  useEffect(() => {
    // Check if the style already exists
    const existingStyle = document.getElementById('rtl-markdown-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'rtl-markdown-styles';
      style.textContent = rtlStyles;
      document.head.appendChild(style);
      
      // Cleanup
      return () => {
        const styleToRemove = document.getElementById('rtl-markdown-styles');
        if (styleToRemove) {
          document.head.removeChild(styleToRemove);
        }
      };
    }
  }, []);

  // Format bullet points if present
  const formattedContent = formatHebrewBulletPoints(content);

  return (
    <Box 
      className="rtl-markdown-container"
      sx={{ 
        color,
        '& ::marker': { color },
        '& ul': { 
          listStyleType: 'disc !important',
          '& li': {
            listStyleType: 'disc !important'
          }
        }
      }}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

export default HebrewMarkdown; 