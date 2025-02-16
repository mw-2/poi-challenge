import React from 'react';

const MapView = ({ hotspots, userPosition }) => {
  const mapSize = 300; // Assuming the map size is 300x300 pixels
  const centerX = mapSize / 2; // Center X position
  const centerY = mapSize / 2; // Center Y position

  return (
    <div id="map" style={{ width: `${mapSize}px`, height: `${mapSize}px`, position: 'absolute', top: '10px', right: '10px', backgroundColor: 'lightgray' }}>
      <h3>Hotspot Map</h3>
      {hotspots.map(hotspot => (
        <div key={hotspot.name} style={{ position: 'absolute', left: `${centerX + (hotspot.ath - 50)}px`, top: `${centerY + (hotspot.atv - 50)}px` }}>
          <div style={{ backgroundColor: 'blue', borderRadius: '50%', width: '8px', height: '8px' }} />
        </div>
      ))}
      {userPosition && (
        <div style={{ position: 'absolute', left: `${centerX}px`, top: `${centerY}px`, backgroundColor: 'red', borderRadius: '50%', width: '10px', height: '10px' }}>
          You
        </div>
      )}
    </div>
  );
};

export default MapView; 