import React, { useEffect, useState } from 'react';
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