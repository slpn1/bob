import * as React from 'react';
import { Alert, IconButton, Link, Typography } from '@mui/joy';
import CloseIcon from '@mui/icons-material/Close';

const BANNER_STORAGE_KEY = 'lumina-quick-start-banner-dismissed';

export function LuminaQuickStartBanner() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Check if the banner has been dismissed before
    const isDismissed = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = React.useCallback(() => {
    // Store dismissal in localStorage
    localStorage.setItem(BANNER_STORAGE_KEY, 'true');
    setIsVisible(false);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Alert
      color="warning"
      variant="solid"
      sx={{
        margin: 2,
        marginBottom: 0,
        borderRadius: 'md',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ff9800',
      }}
      endDecorator={
        <IconButton
          variant="plain"
          size="sm"
          onClick={handleClose}
          sx={{
            mr: -1,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      }
    >
      <Typography level="body-md" sx={{ color: 'inherit', textAlign: 'center', width: '100%' }}>
        ✨ Read how to use the new Lumina on Knowledge Central. Click {' '}
        <Link
          href="https://asandkcommunications.sharepoint.com/sites/SOPCentral/SitePages/Lumina-Quick-Start-Guide1.aspx"
          target="_blank"
          rel="noopener noreferrer"
          underline="always"
          sx={{
            color: 'inherit',
            fontWeight: 'bold',
            '&:hover': {
              opacity: 0.9,
            }
          }}
        >
          here
        </Link>
        {' '}👉
      </Typography>
    </Alert>
  );
}
