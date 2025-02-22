import React, { useEffect, useRef, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import TypesenseClientSingleton from '@/utils/TypesenseClientSingleton';
import { satellite_search_params }  from '../interfaces/sat_data_intf'

const Container = styled('div')({
  position: 'relative',
  width: '100%', // or set to the width you need
  paddingTop: '30px'
});

const StyledSuggestionsContainer = styled(Paper)({
  position: 'relative',
  zIndex: 1,
  left: 0,
  right: 0,
  top: 0,
  maxHeight: '50vh',
  overflow: 'auto',
  border: '1px solid #fff',
  borderRadius: '4px',
  boxShadow: '0px 2px 4px rgba(255, 255, 255, 0.2)',
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  backgroundImage: 'linear-gradient(to right, #33eb91 0%, #000700 100%)',
  color: 'white',
});

const StyledTextField = styled(TextField)({
  '& label.Mui-focused': {
    color: '#33eb91',
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: '#33eb91',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#33eb91',
    },
    '&:hover fieldset': {
      borderColor: '#33eb91',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#33eb91',
    },
    '& input': {
      color: 'white',
    },
  },
});

function SearchAutocomplete({ addSatellite }) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef<TypesenseClientSingleton>(TypesenseClientSingleton.getInstance());
  const client = clientRef.current;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // queries by the satellite name 
  const getSuggestions = async value => {
    try {
      const searchParameters = {
        q: value,
        query_by: 'name,status'
      };
      const result = await client.collections('sats').documents().search(searchParameters);
      return result.hits.map(hit => hit.document);
    } catch (error) {
      console.error("Error fetching suggestions from Typesense:", error);
      return [];
    }
  };

  const onSuggestionsFetchRequested 
  async ({ value }) => {
    setSuggestions(await getSuggestions(value));
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const getSuggestionValue = suggestion => suggestion.name;

  const renderInputComponent = inputProps => (
    <StyledTextField {...inputProps} inputRef={inputRef} fullWidth variant="outlined" />
  );

  const renderSuggestion = (suggestion, { isHighlighted }) => (
    <MenuItem
      selected={isHighlighted}
      component="div"
      style={{
        color: isHighlighted ? 'black' : 'white',
        backgroundColor: isHighlighted ? 'lime' : 'transparent'
      }}
    >
      {suggestion.name} - {suggestion.status}
    </MenuItem>
  );

  const renderSuggestionsContainer = options => (
    <StyledSuggestionsContainer {...options.containerProps} square>
      {options.children}
    </StyledSuggestionsContainer>
  );

  const inputProps = {
    placeholder: "Satellite Name",
    value,
    onChange: (_, { newValue }) => setValue(newValue),
    label: "Search Satellite", // Ensure label is always visible
  };

  const onSuggestionSelected = (event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) => {

    const sat : satellite_search_params = { 
      name: suggestion.name, 
      status: suggestion.status, 
      norad_cat_id: suggestion.norad_cat_id,
      }; 
    addSatellite(sat);

  };

  return (
    <Container>
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestionsContainer={renderSuggestionsContainer}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        renderInputComponent={renderInputComponent}
        inputProps={inputProps}
      />
    </Container>
  );
}

export default SearchAutocomplete;
