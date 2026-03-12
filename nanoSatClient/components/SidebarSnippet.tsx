import React, { useState, useEffect, useRef } from "react";
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const TransparentCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(0, 255, 0, 0.1)', // transparent green tint
  border: '1px solid green',
  cursor: 'pointer',
}));

/**
 * The following interface will be used to create and used in the 
 *
 */
interface SidebarSnippetProps {
  SatName: string;
  Status: string;
  removeSat: (name: string) => void;
}

const SidebarSnippet: React.FC<SidebarSnippetProps> = ({ SatName, Status, removeSat }) => {
  const [textColor, setTextColor] = useState('white');
  const [opacity, setOpacity] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setTextColor('cyan');
    setOpacity(0.7);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
      setTextColor('black');
      setOpacity(1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <TransparentCard ref={cardRef} onClick={handleClick}>
      <CardContent>
        <Typography variant="h5" component="div" style={{ color: textColor, opacity: opacity }}>
          {SatName}
        </Typography>
        <Typography variant="body2" style={{ color: textColor, opacity: opacity }}>
          {Status}
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => removeSat(SatName)}
          style={{ marginTop: '10px' }}
        >
          Remove
        </Button>
      </CardContent>
    </TransparentCard>
  );
}

export default SidebarSnippet;
