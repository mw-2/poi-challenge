import React from 'react';

const MapView = ({ hotspots, userPosition, isLoading }) => {
  const mapSize = 300;
  const padding = 20;
  const centerX = mapSize / 2;
  const centerY = mapSize / 2;

  const normalizeCoordinateX = (ath) => {
    return centerX + (ath / 180) * (centerX - padding);
  };

  const normalizeCoordinateY = (atv) => {
    return centerY + (atv / 90) * (centerY - padding);
  };

  const mapStyle = {
    width: `${mapSize}px`,
    height: `${mapSize}px`,
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    padding: '10px',
  };

  const hotspotStyle = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: 'blue',
    borderRadius: '50%',
    transform: 'translate(-5px, -5px)',
  };

  const userPositionStyle = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: 'red',
    borderRadius: '50%',
    transform: 'translate(-6px, -6px)',
    animation: 'pulse 1s infinite alternate',
  };

  return (
    <div id="map" style={mapStyle}>
      <h3>Hotspot Map</h3>
      {hotspots.map(hotspot => {
        const x = normalizeCoordinateX(hotspot.ath);
        const y = normalizeCoordinateY(hotspot.atv);

        return (
          <div key={hotspot.name} style={{ left: `${x}px`, top: `${y}px`, position: 'absolute' }}>
            <div style={hotspotStyle} />
          </div>
        );
      })}
      {userPosition && !isLoading && (
        <div style={{
          left: centerX - 6,
          top: centerY - 6,
          position: 'absolute',
        }}>
          <div style={userPositionStyle}></div>
        </div>
      )}
      {isLoading && <div>Loading...</div>}
    </div>
  );
};

export default MapView;