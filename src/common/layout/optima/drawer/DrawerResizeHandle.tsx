import * as React from 'react';
import { Box } from '@mui/joy';

export interface DrawerResizeHandleProps {
  onResize: (newWidth: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

export function DrawerResizeHandle({ onResize, minWidth = 280, maxWidth = 600 }: DrawerResizeHandleProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startWidth, setStartWidth] = React.useState(0);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    
    // Get current drawer width from CSS variable
    const currentWidth = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--AGI-Desktop-Drawer-width')) || 320;
    setStartWidth(currentWidth);
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, startWidth, onResize, minWidth, maxWidth]);

  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '4px',
        height: '100%',
        cursor: 'col-resize',
        backgroundColor: 'transparent',
        transition: isDragging ? 'none' : 'background-color 0.2s ease',
        zIndex: 10,
        
        '&:hover': {
          backgroundColor: 'primary.solidBg',
        },
        
        '&:active': {
          backgroundColor: 'primary.solidBg',
        },

        // Add a larger invisible area for easier grabbing
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-2px',
          right: '-2px',
          height: '100%',
          cursor: 'col-resize',
        },
      }}
    />
  );
}