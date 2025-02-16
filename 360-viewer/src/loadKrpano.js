import React from 'react'; // Ensure React is imported
import ReactDOM from 'react-dom/client'; // Import ReactDOM from 'react-dom/client'
import MapView from './MapView'; // Import the new MapView component

const KRPANO_VIEWER_TARGET_ID = "krpano-target";
const KRPANO_VIEWER_ID = "krpano-viewer";

const loadKrpano = () => {
  let xmlStr;
  let krpanoInstance;
  let hotspots = []; // New state to manage hotspots
  let userPosition = null; // New state to manage user position

  // Function to update user position
  const updateUserPosition = (position) => {
    userPosition = {
      ath: position.coords.longitude, // Assuming ath corresponds to longitude
      atv: position.coords.latitude // Assuming atv corresponds to latitude
    };
    updateMap(); // Update the map with the new user position
  };

  // Get user's current position
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(updateUserPosition);
  }

  function onKRPanoReady(krpano) {
    krpanoInstance = krpano;
    try {
      krpano.call(`loadxml(${xmlStr})`);
      loadSavedHotspots();
      updateMap(); // Update the map with hotspots

      document.getElementById(KRPANO_VIEWER_TARGET_ID).addEventListener('dblclick', onViewerDoubleClick);
    } catch (err) {
      console.error("Error loading krpano xml", err);
    }
  }

  function onViewerDoubleClick(event) {
    const x = event.clientX;
    const y = event.clientY;

    const secondHotspot = krpanoInstance.addhotspot();
    secondHotspot.name = `hotspot_${Date.now()}`; // Unique name for each hotspot
    secondHotspot.type = "text";
    secondHotspot.text = "Second Hotspot";
    secondHotspot.ath = krpanoInstance.screentosphere(x, y).x;
    secondHotspot.atv = krpanoInstance.screentosphere(x, y).y;

    secondHotspot.onclick = function() {
      const mouseX = krpanoInstance.get("mouse.x");
      const mouseY = krpanoInstance.get("mouse.y");

      const coordinateDisplay = document.getElementById("coordinateDisplay");
      coordinateDisplay.innerText = `Coordinates: x=${mouseX}, y=${mouseY}`;
    };

    // Add editable text field to the hotspot
    secondHotspot.editable = true;
    secondHotspot.editenterkey = "newline";
    secondHotspot.oneditstop = function() {
      console.log("Editing stopped for hotspot:", secondHotspot.name);
      saveHotspot(secondHotspot); // Save the hotspot when editing stops
    };

    hotspots.push(secondHotspot); // Add the new hotspot to the hotspots array
    updateMap(); // Update the map with the new hotspot
  }

  function updateMap() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      const mapWidth = mapContainer.clientWidth;
      const mapHeight = mapContainer.clientHeight;

      // Convert hotspot positions to percentage
      const hotspotsWithPercentage = hotspots.map(hotspot => ({
        ...hotspot,
        ath: (hotspot.ath / 360) * 100, // Convert ath to percentage
        atv: (hotspot.atv / 180) * 100  // Convert atv to percentage
      }));

      // Convert user position to percentage
      const userPositionWithPercentage = userPosition ? {
        ath: (userPosition.ath / 360) * 100,
        atv: (userPosition.atv / 180) * 100
      } : null;

      const root = ReactDOM.createRoot(mapContainer); // Create a root for the map container
      root.render(<MapView hotspots={hotspotsWithPercentage} userPosition={userPositionWithPercentage} />); // Render the MapView component
    }
  }

  // Function to save hotspot data to localStorage
  function saveHotspot(hotspot) {
    const savedHotspots = JSON.parse(localStorage.getItem('hotspots') || '{}');
    savedHotspots[hotspot.name] = {
      text: hotspot.text,
      ath: hotspot.ath,
      atv: hotspot.atv
    };
    localStorage.setItem('hotspots', JSON.stringify(savedHotspots));
  }

  // Function to load saved hotspots from localStorage
  function loadSavedHotspots() {
    const savedHotspots = JSON.parse(localStorage.getItem('hotspots') || '{}');
    for (const [name, data] of Object.entries(savedHotspots)) {
      const hotspot = krpanoInstance.addhotspot();
      hotspot.name = name;
      hotspot.type = "text";
      hotspot.text = data.text;
      hotspot.ath = data.ath;
      hotspot.atv = data.atv;
      hotspot.editable = true;
      hotspot.editenterkey = "newline";
      hotspot.oneditstop = function() {
        console.log("Editing stopped for hotspot:", hotspot.name);
        saveHotspot(hotspot); // Save the hotspot when editing stops
      };
    }
  }

  function onKRPanoError(err) {
    console.error("Error embedding krpano", err);
    // eslint-disable-next-line no-undef
    removepano(KRPANO_VIEWER_ID);
    const target = document.getElementById(KRPANO_VIEWER_TARGET_ID);
    target.remove();
  }

  fetch("https://api.viewer.immersiondata.com/api/v1/panoramas/311975/krpano.xml")
    .then((res) => res.text())
    .then((xml) => {
      xmlStr = xml;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');

      // Replace remote nadir url with local asset due to CORS errors
      const nadirHotspotElem = xmlDoc.querySelector("hotspot[name='nadirlogo']");
      nadirHotspotElem.setAttribute('url', './ids-nadir.png');

      const serializer = new XMLSerializer();
      xmlStr = serializer.serializeToString(xmlDoc);

      // eslint-disable-next-line no-undef
      embedpano({
        xml: null,
        html5: "prefer",
        consolelog: true,
        capturetouch: false, // prevent default touch event handling from being disabled
        bgcolor: "#F4F6F8",
        id: KRPANO_VIEWER_ID,
        target: KRPANO_VIEWER_TARGET_ID,
        onready: onKRPanoReady,
        onerror: onKRPanoError,
      });
    })
    .catch(onKRPanoError);
};

export default loadKrpano;