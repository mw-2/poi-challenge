const KRPANO_VIEWER_TARGET_ID = "krpano-target";
const KRPANO_VIEWER_ID = "krpano-viewer";

const loadKrpano = () => {
  let xmlStr;
  let krpanoInstance;
  let selectedHotspot = null;
  
  window.selectHotspot = function (hotspotName) {
    const hotspot = krpanoInstance.get(`hotspot[${hotspotName}]`);
    if (!hotspot) return;
  
    // Un-highlight any previously selected hotspot
    if (selectedHotspot) {
      selectedHotspot.bordercolor = null;
    }
  
    // Select & highlight it
    selectedHotspot = hotspot;
    hotspot.bordercolor = "0xFF0000";
    hotspot.borderwidth = 2;
    hotspot.editable = true; // Make it editable immediately after selection
  };
  
  window.unselectHotspot = function (hotspotName) {
    const hotspot = krpanoInstance.get(`hotspot[${hotspotName}]`);
    if (!hotspot) return;
    hotspot.bordercolor = null;
    hotspot.editable = false;
    selectedHotspot = null;
  };
  
  function onKRPanoReady(krpano) {
    krpanoInstance = krpano;
    try {
      krpano.call(`loadxml(${xmlStr})`);
  
      // Attach onclick event to existing hotspots
      const hotspots = krpanoInstance.get("hotspot"); // Get all hotspots
      for (let i = 0; i < hotspots.length; i++) {
        const hotspot = hotspots[i];
        krpanoInstance.call(`set(hotspot[${hotspot.name}].onclick, "js(selectHotspot('${hotspot.name}'))")`);
        krpanoInstance.call(`set(hotspot[${hotspot.name}].oneditstop, "js(unselectHotspot('${hotspot.name}'))")`);
      }
  
      // Listen for double-click to create a new hotspot
      document
        .getElementById(KRPANO_VIEWER_TARGET_ID)
        .addEventListener("dblclick", onViewerDoubleClick);
  
      // Helper for deleting the selected hotspot
      function removeSelectedHotspot() {
        if (!selectedHotspot) return;
        krpanoInstance.call(`removehotspot(${selectedHotspot.name})`);
        selectedHotspot = null;
      }
  
      // Add 'Delete' key listener for removing selected hotspot
      document.addEventListener("keydown", (event) => {
        if (event.key === "Delete") {
          removeSelectedHotspot();
        }
      });
    } catch (err) {
      console.error("Error loading krpano xml", err);
    }
  }
  
  function onViewerDoubleClick(event) {
    const x = event.clientX;
    const y = event.clientY;
  
    // Create a unique hotspot and set its onclick/oneditstop via krpano calls
    const hotspotName = `hotspot_${Date.now()}`;
    krpanoInstance.call(`addhotspot(${hotspotName})`);
    krpanoInstance.call(`set(hotspot[${hotspotName}].type, text)`);
    krpanoInstance.call(`set(hotspot[${hotspotName}].text, "New Hotspot")`);
    krpanoInstance.call(`set(hotspot[${hotspotName}].ath, ${krpanoInstance.screentosphere(x, y).x})`);
    krpanoInstance.call(`set(hotspot[${hotspotName}].atv, ${krpanoInstance.screentosphere(x, y).y})`);
    krpanoInstance.call(`set(hotspot[${hotspotName}].editable, false)`);
  
    // Assign JS callbacks for selecting/unselecting
    krpanoInstance.call(`set(hotspot[${hotspotName}].onclick, "js(selectHotspot('${hotspotName}'))")`);
    krpanoInstance.call(`set(hotspot[${hotspotName}].oneditstop, "js(unselectHotspot('${hotspotName}'))")`);
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