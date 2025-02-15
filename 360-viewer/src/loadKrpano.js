const KRPANO_VIEWER_TARGET_ID = "krpano-target";
const KRPANO_VIEWER_ID = "krpano-viewer";

let krpanoInstance = null; // Declare krpanoInstance outside the function
let hotspotData = {}; // Declare hotspotData outside the function
let selectedHotspot = null; // Declare selectedHotspot outside the function

const loadKrpano = () => {
  let xmlStr;

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

      // Show the popup with the hotspot text
      const popup = krpanoInstance.get("layer[popup]");
      const popupcontent = krpanoInstance.get("layer[popupcontent]");
      popup.visible = true;
      popupcontent.html = hotspotData[hotspotName]?.text || hotspot.text;
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

      // Hide the popup
      const popup = krpanoInstance.get("layer[popup]");
      popup.visible = false;
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
          callKrpano(`set(hotspot[${hotspotName}].oneditstop, "save_hotspot_data('${hotspotName}')")`);
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

      // Create the popup layer
      krpano.call(`
        addlayer(popup);
        set(layer[popup].type, container);
        set(layer[popup].align, righttop);
        set(layer[popup].x, -10);
        set(layer[popup].y, 10);
        set(layer[popup].width, 300);
        set(layer[popup].height, 100);
        set(layer[popup].bgcolor, 0xFFFFFF);
        set(layer[popup].bgalpha, 1);
        set(layer[popup].bgborder, 1 0x777777 0.5);
        set(layer[popup].bgroundedge, 7);
        set(layer[popup].bgshadow, 0 4 20 0x000000 0.25);
        set(layer[popup].visible, false); // Initially hidden

        addlayer(popupcontent);
        set(layer[popupcontent].parent, popup);
        set(layer[popupcontent].type, text);
        set(layer[popupcontent].align, lefttop);
        set(layer[popupcontent].htmlautosize, true);
        set(layer[popupcontent].width, 100%);
        set(layer[popupcontent].bgalpha, 0.0);
        set(layer[popupcontent].css, color:black; font-size:14px;);
        set(layer[popupcontent].editable, true);
        set(layer[popupcontent].editenterkey, newline);
        set(layer[popupcontent].oneditstop, "save_hotspot_data(currentHotspotName)");
      `);

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
          const hotspotName = selectedHotspot.name;
          callKrpano(`removehotspot(${hotspotName})`);
          delete hotspotData[hotspotName]; // Remove from local storage
          localStorage.setItem('hotspotData', JSON.stringify(hotspotData)); // Save to local storage
          selectedHotspot = null; // Clear the selected hotspot after removal

          // Hide the popup
          const popup = krpanoInstance.get("layer[popup]");
          popup.visible = false;
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

      // Load hotspot data from local storage
      const storedHotspotData = localStorage.getItem('hotspotData');
      if (storedHotspotData) {
        hotspotData = JSON.parse(storedHotspotData);
        Object.keys(hotspotData).forEach(hotspotName => {
          const hotspot = hotspotData[hotspotName];
          callKrpano(`addhotspot(${hotspotName})`);
          callKrpano(`set(hotspot[${hotspotName}].type, text)`);
          callKrpano(`set(hotspot[${hotspotName}].text, "${hotspot.text}")`);
          callKrpano(`set(hotspot[${hotspotName}].ath, ${hotspot.ath})`);
          callKrpano(`set(hotspot[${hotspotName}].atv, ${hotspot.atv})`);
          callKrpano(`set(hotspot[${hotspotName}].editable, true)`); // Make it editable
          callKrpano(`set(hotspot[${hotspotName}].onclick, "js(selectHotspot('${hotspotName}'))")`);
          callKrpano(`set(hotspot[${hotspotName}].oneditstop, "save_hotspot_data('${hotspotName}')")`);
        });
      }

      krpano.call(`
        <!-- Define the action to save hotspot data -->
        <action name="save_hotspot_data">
          js(saveHotspotData( %1 ));
        </action>
      `);
    } catch (err) {
      console.error("Error loading krpano xml", err);
    }
  }

  function onViewerDoubleClick(event) {
    if (!krpanoInstance) return; // Ensure krpanoInstance is valid

    const x = event.clientX;
    const y = event.clientY;

    // Create a unique hotspot and set its onclick/oneditstop via krpano calls
    const hotspotName = `hotspot_${Date.now()}`;
    callKrpano(`addhotspot(${hotspotName})`);
    callKrpano(`set(hotspot[${hotspotName}].type, text)`);
    callKrpano(`set(hotspot[${hotspotName}].text, "New Hotspot")`);
    callKrpano(`set(hotspot[${hotspotName}].ath, ${krpanoInstance.screentosphere(x, y).x})`);
    callKrpano(`set(hotspot[${hotspotName}].atv, ${krpanoInstance.screentosphere(x, y).y})`);
    callKrpano(`set(hotspot[${hotspotName}].editable, true)`); // Make it editable

    // Assign JS callbacks for selecting/unselecting
    callKrpano(`set(hotspot[${hotspotName}].onclick, "js(selectHotspot('${hotspotName}'))")`);
    callKrpano(`set(hotspot[${hotspotName}].oneditstop, "save_hotspot_data('${hotspotName}')")`);

    // Save the new hotspot data
    hotspotData[hotspotName] = {
      text: "New Hotspot",
      ath: krpanoInstance.screentosphere(x, y).x,
      atv: krpanoInstance.screentosphere(x, y).y
    };
    saveHotspotData();
  }

  function saveHotspotData(hotspotName) {
    const hotspot = krpanoInstance.get(`hotspot[${hotspotName}]`);
    const popupcontent = krpanoInstance.get("layer[popupcontent]");
    if (hotspot) {
      hotspotData[hotspotName] = {
        text: popupcontent.html,
        ath: hotspot.ath,
        atv: hotspot.atv
      };
    }
    localStorage.setItem('hotspotData', JSON.stringify(hotspotData)); // Save to local storage
    fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ hotspots: hotspotData })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Hotspot data saved:', data);
    })
    .catch(error => {
      console.error('Error saving hotspot data:', error);
    });
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