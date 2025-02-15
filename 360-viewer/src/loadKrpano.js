const KRPANO_VIEWER_TARGET_ID = "krpano-target";
const KRPANO_VIEWER_ID = "krpano-viewer";

let krpanoInstance = null; // Declare krpanoInstance outside the function

const loadKrpano = () => {
  let xmlStr;
  let selectedHotspot = null;

  // Function to safely call krpano functions
  const callKrpano = (command) => {
    if (krpanoInstance && typeof krpanoInstance.call === 'function') {
      try {
        krpanoInstance.call(command);
      } catch (error) {
        console.error(`Krpano call error for command "${command}":`, error);
      }
    } else {
      console.warn('krpanoInstance not ready or call function not available.');
    }
  };

  window.selectHotspot = function (hotspotName) {
    if (!krpanoInstance) {
      console.warn('krpanoInstance not ready.');
      return;
    }

    try {
      const hotspot = krpanoInstance.get(`hotspot[${hotspotName}]`);
      if (!hotspot) {
        console.warn(`Hotspot "${hotspotName}" not found.`);
        return;
      }

      // Un-highlight any previously selected hotspot
      if (selectedHotspot) {
        selectedHotspot.bordercolor = null;
        selectedHotspot.borderwidth = null;
        selectedHotspot.editable = false;
      }

      // Select & highlight it
      selectedHotspot = hotspot;
      hotspot.bordercolor = "0xFF0000";
      hotspot.borderwidth = 2;
      hotspot.editable = true; // Make it editable immediately after selection
    } catch (error) {
      console.error("Error selecting hotspot:", error);
    }
  };

  window.unselectHotspot = function (hotspotName) {
    if (!krpanoInstance) {
      console.warn('krpanoInstance not ready.');
      return;
    }

    try {
      const hotspot = krpanoInstance.get(`hotspot[${hotspotName}]`);
      if (!hotspot) {
        console.warn(`Hotspot "${hotspotName}" not found.`);
        return;
      }
      hotspot.bordercolor = null;
      hotspot.borderwidth = null;
      hotspot.editable = false;
      selectedHotspot = null;
    } catch (error) {
      console.error("Error unselecting hotspot:", error);
    }
  };

  function attachHotspotEvents() {
    if (!krpanoInstance) {
      console.warn('krpanoInstance not ready to attach hotspot events. Retrying...');
      setTimeout(attachHotspotEvents, 500); // Retry after 500ms
      return;
    }

    try {
      // Attach onclick event to existing hotspots
      const hotspots = krpanoInstance.get("hotspot"); // Get all hotspots
      if (hotspots && hotspots.length > 0) {
        for (let i = 0; i < hotspots.length; i++) {
          const hotspot = hotspots[i];
          const hotspotName = hotspot.name; // Store the hotspot name
          callKrpano(`set(hotspot[${hotspotName}].onclick, "js(selectHotspot('${hotspotName}'))")`);
          callKrpano(`set(hotspot[${hotspotName}].oneditstop, "js(unselectHotspot('${hotspotName}'))")`);
        }
      } else {
        console.warn('No hotspots found to attach events to.');
      }
    } catch (error) {
      console.error("Error attaching hotspot events:", error);
    }
  }

  function onKRPanoReady(krpano) {
    krpanoInstance = krpano;
    try {
      krpano.call(`loadxml(${xmlStr})`);


      // Load saved hotspots from localStorage
      loadSavedHotspots();

      // Add event listener for mouse double-clicks
      document.getElementById(KRPANO_VIEWER_TARGET_ID).addEventListener('dblclick', onViewerDoubleClick);

      // Attach hotspot events after krpano is ready and XML is loaded
      attachHotspotEvents();

      // Listen for double-click to create a new hotspot
      const viewerTarget = document.getElementById(KRPANO_VIEWER_TARGET_ID);
      if (viewerTarget) {
        viewerTarget.addEventListener("dblclick", onViewerDoubleClick);
      }

      // Helper for deleting the selected hotspot
      function removeSelectedHotspot() {
        if (!selectedHotspot) {
          console.warn('No hotspot selected to remove.');
          return;
        }

        try {
          callKrpano(`removehotspot(${selectedHotspot.name})`);
          selectedHotspot = null; // Clear the selected hotspot after removal
        } catch (error) {
          console.error("Error removing hotspot:", error);
        }
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
    if (!krpanoInstance) return; // Ensure krpanoInstance is valid

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

    // Create a unique hotspot and set its onclick/oneditstop via krpano calls
    const hotspotName = `hotspot_${Date.now()}`;
    callKrpano(`addhotspot(${hotspotName})`);
    callKrpano(`set(hotspot[${hotspotName}].type, text)`);
    callKrpano(`set(hotspot[${hotspotName}].text, "New Hotspot")`);
    callKrpano(`set(hotspot[${hotspotName}].ath, ${krpanoInstance.screentosphere(x, y).x})`);
    callKrpano(`set(hotspot[${hotspotName}].atv, ${krpanoInstance.screentosphere(x, y).y})`);
    callKrpano(`set(hotspot[${hotspotName}].editable, false)`);

    // Assign JS callbacks for selecting/unselecting
    callKrpano(`set(hotspot[${hotspotName}].onclick, "js(selectHotspot('${hotspotName}'))")`);
    callKrpano(`set(hotspot[${hotspotName}].oneditstop, "js(unselectHotspot('${hotspotName}'))")`);
  }


  function onKRPanoError(err) {
    console.error("Error embedding krpano", err);
    // eslint-disable-next-line no-undef
    removepano(KRPANO_VIEWER_ID);
    const target = document.getElementById(KRPANO_VIEWER_TARGET_ID);
    target.remove();
  }

  // Function to remove the krpano viewer
  function removeKrpanoViewer() {
    const krpanoElement = document.getElementById(KRPANO_VIEWER_ID);
    if (krpanoElement) {
      krpanoElement.parentNode.removeChild(krpanoElement);
    }
    krpanoInstance = null;
  }

  // Remove the krpano viewer before embedding a new instance
  removeKrpanoViewer();

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