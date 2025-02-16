import React, { useEffect, useState } from 'react';
import Select from 'react-select'; // Add this import
import { loadKrpano, goBackToPreviousPanorama } from './loadKrpano';
import './App.css';

function App() {
  const [isInverted, setIsInverted] = useState(false);

  useEffect(() => {
    loadKrpano("https://api.viewer.immersiondata.com/api/v1/panoramas/311975/krpano.xml"); // Initial panorama
  }, []);

  const handleDeleteClick = () => {
    // Call the removeAllHotspots function
    window.removeAllHotspots();
  };

  const toggleInvert = () => {
    setIsInverted(prev => !prev);
  };

  const loadAnotherPanorama = (panoramaId) => {
    // Update the panoramaId to a new URL for a different panorama
    loadKrpano(`https://api.viewer.immersiondata.com/api/v1/panoramas/311976/krpano.xml`); // Load specified panorama
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
      <button
        style={{
          position: 'absolute',
          top: '130px',
          left: '10px',
          zIndex: 1000,
        }}
        onClick={() => loadAnotherPanorama('311976')}
      >
        Load Another Panorama
      </button>
      <button
        style={{
          position: 'absolute',
          top: '160px',
          left: '10px',
          zIndex: 1000,
        }}
        onClick={goBackToPreviousPanorama}
      >
        Back to Previous Panorama
      </button>
      <div id="krpano-target"></div>
      <div id="map"></div>
    </div>
  );
}

export default App;