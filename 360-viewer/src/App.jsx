import React, { useEffect, useState } from 'react';
import Select from 'react-select'; // Add this import
import loadKrpano from './loadKrpano';
import './App.css';

function App() {
  const [isInverted, setIsInverted] = useState(false);

  useEffect(() => {
    loadKrpano();
  }, []);

  const handleDeleteClick = () => {
    // Call the removeAllHotspots function
    window.removeAllHotspots();
  };

  const toggleInvert = () => {
    setIsInverted(prev => !prev);
  };

  return (
    <div id="app" className={isInverted ? 'inverted' : ''}>
      <button
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000, // Ensure it's on top of other elements
        }}
        onClick={handleDeleteClick}
      >
        Delete All Hotspots
      </button>
      <button
        style={{
          position: 'absolute',
          top: '40px', // Adjust top position for spacing
          left: '10px',
          zIndex: 1000, // Ensure it's on top of other elements
        }}
        onClick={() => window.saveHotspotsToFile()}
      >
        Save Hotspots
      </button>

      <div
        style={{
          position: 'absolute',
          top: '200px',
          left: '10px',
          width: '280px',
          zIndex: 1000,
        }}
      >
        <div style={{ marginBottom: '5px', color: '#333', fontWeight: 'bold' }}>
          Filter PoI by Tag
        </div>
        <Select
          options={[
            { value: 'Maintenance', label: 'Maintenance' },
            { value: 'Safety', label: 'Safety' },
            { value: 'Information', label: 'Information' }
          ]}
          isMulti
          placeholder="Select tags..."
          onChange={window.filterHotspotsByProperties}
        />
      </div>

      <button
        style={{
          position: 'absolute',
          top: '70px', // Adjust top position for spacing
          left: '10px',
          zIndex: 1000, // Ensure it's on top of other elements
        }}
        onClick={() => window.loadHotspotsFromFile()}
      >
        Load Hotspots
      </button>
      <button
        style={{
          position: 'absolute',
          top: '100px', // Adjust top position for spacing
          left: '10px',
          zIndex: 1000,
        }}
        onClick={toggleInvert}
      >
        Invert Background
      </button>
      <div id="krpano-target"></div>
      <div id="map"></div>
    </div>
  );
}

export default App;