import React, { useEffect } from 'react';
import loadKrpano from './loadKrpano';
import './App.css';

function App() {
  useEffect(() => {
    loadKrpano();
  }, []);

  const handleDeleteClick = () => {
    // Call the removeAllHotspots function
    window.removeAllHotspots();
  };

  return (
    <div id="app">
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
      <div id="krpano-target"></div>
      <div id="map"></div>
    </div>
  );
}

export default App;