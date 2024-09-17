import { Drawer, IconButton, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutocompleteSearchBar from './AutocompleteSearchBar';
import SearchAutocomplete from './SearchAutoComplete';

const Sidebar : React.FC = ({ isVisible, toggle }) => {
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
         Search  🔍
        </Typography>
        <Typography variant="body1">
          🛰️ 🛰️ 🛰️ 🛰️ 🛰️ 🛰️ 🛰️ 🛰️ 🛰️ 
        </Typography>
        
      </Box>
      {/* <AutocompleteSearchBar /> */}
      <SearchAutocomplete />
    </Drawer>
  );
};

export default Sidebar;
