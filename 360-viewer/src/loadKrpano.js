const KRPANO_VIEWER_TARGET_ID = "krpano-target";
const KRPANO_VIEWER_ID = "krpano-viewer";

const loadKrpano = () => {
  let xmlStr;
  let krpanoInstance;

  function onKRPanoReady(krpano) {
    krpanoInstance = krpano;
    try {
      krpano.call(`loadxml(${xmlStr})`);

      // Load saved hotspots from localStorage
      loadSavedHotspots();

      // Add event listener for mouse double-clicks
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