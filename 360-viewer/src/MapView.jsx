import React from 'react';

const MapView = ({ hotspots, userPosition }) => {
  const mapSize = 300;
  const padding = 20; // Add padding to keep points away from edges

  const normalizeCoordinate = (value, range) => {
    // Simple mapping to keep values within padding bounds
    return padding + (value % range) * ((mapSize - 2 * padding) / range);
  };

  return (
    <div id="map" style={{ width: `${mapSize}px`, height: `${mapSize}px`, position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'lightgray' }}>
      <h3>Hotspot Map</h3>
      {hotspots.map(hotspot => {
        // Simple normalization to keep points within map bounds
        const x = normalizeCoordinate(hotspot.ath + 180, 360); // Add 180 to shift range from [-180,180] to [0,360]
        const y = normalizeCoordinate(hotspot.atv + 90, 180);  // Add 90 to shift range from [-90,90] to [0,180]

        return (
          <div key={hotspot.name} style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-4px, -4px)' // Center the dot
          }}>
            <div style={{ backgroundColor: 'blue', borderRadius: '50%', width: '8px', height: '8px' }} />
          </div>
        );
      })}
      {userPosition && (
        <div style={{
          position: 'absolute',
          left: `${mapSize / 2}px`,
          top: `${mapSize / 2}px`,
          transform: 'translate(-5px, -5px)', // Center the dot
          backgroundColor: 'red',
          borderRadius: '50%',
          width: '10px',
          height: '10px'
        }}>
          You
        </div>
      )}
    </div>
  );
};

export default MapView;