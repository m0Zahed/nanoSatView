import { ListItem, ListItemText, Button } from "@mui/material";
import React, { useState, useEffect } from 'react';

interface SatelliteItemProps {
  satellite: Satellite_Details;
  onToggleHidden: (satName: string) => void;
}

const SatelliteItem: React.FC<SatelliteItemProps> = ({ satellite, onToggleHidden }) => {
  const [hide_show, set_hide_show] = useState<string>("Hide");
  return (
    <ListItem key={satellite.name} divider>
      <ListItemText
        primary={satellite.name || `Satellite ${satellite.name}`}
        secondary={
          <>
            <div>
              <strong>Velocity:</strong>{" "}
              {satellite.velocity !== undefined ? satellite.velocity.toFixed(2) : "N/A"}
            </div>
            <div>
              <strong>Latitude:</strong>{" "}
              {satellite.lat !== undefined ? satellite.lat.toFixed(2) : "N/A"}
            </div>
            <div>
              <strong>Longitude:</strong>{" "}
              {satellite.longitude !== undefined ? satellite.longitude.toFixed(2) : "N/A"}
            </div>
            <div>
              <strong>Elevation:</strong>{" "}
              {satellite.elevation !== undefined ? satellite.elevation.toFixed(2) : "N/A"}
            </div>
            <div>
              <strong>Last TLE Time:</strong>{" "}
              {satellite.lastTLETime ? new Date(satellite.lastTLETime).toLocaleString() : "N/A"}
            </div>
          </>
        }
      />
      <Button
        variant="contained"
        onClick={() => { 
          onToggleHidden(satellite.name)
          hide_show === "Hide" ?
            set_hide_show("Show") : set_hide_show("Hide"); 
        }}
        sx={{ height: "fit-content" }}
      >
        {hide_show}
      </Button>
    </ListItem>
  );
};

export default SatelliteItem;
