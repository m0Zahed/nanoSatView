import { Drawer, IconButton, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutocompleteSearchBar from './AutocompleteSearchBar';

const Sidebar = ({ isVisible, toggle }) => {
  return (
    <Drawer
      anchor="right"
      open={isVisible}
      onClose={toggle}
      PaperProps={{
        sx: {
          width: '300px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderLeft: '2px dashed white',
        },
      }}
    >
      <Box sx={{ padding: '20px' }}>
        <IconButton
          onClick={toggle}
          sx={{ color: 'white', position: 'absolute', top: '10px', right: '10px' }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" gutterBottom>
          Sidebar
        </Typography>
        <Typography variant="body1">
          This is a transparent sidebar overlay with white text and a white dashed border.
        </Typography>
      </Box>
      <AutocompleteSearchBar />
    </Drawer>
  );
};

export default Sidebar;
