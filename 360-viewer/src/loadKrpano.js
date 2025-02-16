import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Select from 'react-select';
import MapView from './MapView';

/* global removepano, embedpano */

const KRPANO_VIEWER_TARGET_ID = "krpano-target";
const KRPANO_VIEWER_ID = "krpano-viewer";

let krpanoInstance = null;
let hotspotData = {};
let selectedHotspot = null;
let activePopups = {};
let userPosition = { ath: 180, atv: 90 };
let userPositionLoading = false;

const loadKrpano = () => {
  let xmlStr;

  const saveHotspotsToFile = () => {
    fetch('http://localhost:3001/api/hotspots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hotspotData)
    })
      .then(response => response.json())
      .then(data => {
        console.log('Hotspot data saved to backend:', data);
      })
      .catch(error => {
        console.error('Error saving hotspot data to backend:', error);
      });
  };

  const loadHotspotsFromFile = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const fileContent = JSON.parse(e.target.result);
              hotspotData = fileContent;
              Object.keys(hotspotData).forEach(hotspotName => {
                const hotspot = hotspotData[hotspotName];
                addHotspotWithPopup(hotspotName, hotspot.text, hotspot.ath, hotspot.atv);
              });
              updateMap();
            } catch (error) {
              console.error('Error parsing JSON file:', error);
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } catch (error) {
      console.error('Error loading hotspots from file:', error);
    }
  };

  window.saveHotspotsToFile = saveHotspotsToFile;
  window.loadHotspotsFromFile = loadHotspotsFromFile;

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

      if (selectedHotspot) {
        const prevHotspotName = selectedHotspot.name;
        if (activePopups[prevHotspotName]) {
          activePopups[prevHotspotName].popup.visible = false;
          document.getElementById(`popupselect_${prevHotspotName}`).style.display = 'none';
        }
        selectedHotspot.bordercolor = null;
        selectedHotspot.borderwidth = null;
        selectedHotspot.editable = false;
      }

      selectedHotspot = hotspot;
      hotspot.bordercolor = "0xFF0000";
      hotspot.borderwidth = 2;
      hotspot.editable = true;

      if (!activePopups[hotspotName]) {
        const popupName = `popup_${hotspotName}`;
        const popupContentName = `popupcontent_${hotspotName}`;
        const popupTitleName = `popuptitle_${hotspotName}`;
        const popupSelectName = `popupselect_${hotspotName}`;

        krpanoInstance.call(`
          addlayer(${popupName});
          set(layer[${popupName}].type, container);
          set(layer[${popupName}].align, righttop);
          set(layer[${popupName}].x, -10);
          set(layer[${popupName}].y, 10);
          set(layer[${popupName}].width, 300);
          set(layer[${popupName}].height, 200);
          set(layer[${popupName}].bgcolor, 0xFFFFFF);
          set(layer[${popupName}].bgalpha, 1);
          set(layer[${popupName}].bgborder, 1 0x777777 0.5);
          set(layer[${popupName}].bgroundedge, 7);
          set(layer[${popupName}].bgshadow, 0 4 20 0x000000 0.25);
          set(layer[${popupName}].visible, true);
  
          addlayer(${popupTitleName});
          set(layer[${popupTitleName}].parent, ${popupName});
          set(layer[${popupTitleName}].type, text);
          set(layer[${popupTitleName}].align, lefttop);
          set(layer[${popupTitleName}].html, '<b>POI Comment Section</b>');
          set(layer[${popupTitleName}].width, 100%);
          set(layer[${popupTitleName}].height, 20);
          set(layer[${popupTitleName}].css, color:black; font-size:12px; font-weight: bold; text-align: center;);
          set(layer[${popupTitleName}].bgalpha, 0.0);
          set(layer[${popupTitleName}].y, 0);
  
          addlayer(${popupContentName});
          set(layer[${popupContentName}].parent, ${popupName});
          set(layer[${popupContentName}].type, text);
          set(layer[${popupContentName}].align, lefttop);
          set(layer[${popupContentName}].htmlautosize, true);
          set(layer[${popupContentName}].width, 100%);
          set(layer[${popupContentName}].bgalpha, 0.0);
          set(layer[${popupContentName}].css, color:black; font-size:14px;);
          set(layer[${popupContentName}].editable, true);
          set(layer[${popupContentName}].editenterkey, newline);
          set(layer[${popupContentName}].y, 20);
          set(layer[${popupContentName}].oneditstop, "js(saveHotspotData(get(caller.parent.name.substr(6))))");
        `);

        const popupContent = krpanoInstance.get(`layer[${popupContentName}]`);
        popupContent.html = hotspotData[hotspotName]?.text || hotspot.text;

        const popupSelect = document.createElement('div');
        popupSelect.id = popupSelectName;
        popupSelect.style.position = 'fixed';
        popupSelect.style.top = '10px'; // Position below the popup box
        popupSelect.style.right = '10px';
        popupSelect.style.width = '280px';
        document.body.appendChild(popupSelect);

        const root = ReactDOM.createRoot(popupSelect);
        root.render(
          <Select
            options={options}
            isMulti
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions.map(option => option.value);
              hotspotData[hotspotName].properties = selectedValues;
              saveHotspotData(hotspotName);
            }}
          />
        );

        activePopups[hotspotName] = {
          popup: krpanoInstance.get(`layer[${popupName}]`),
          content: popupContent,
          select: popupSelect
        };
      }

      // Show the popup and multiselect for the selected hotspot and hide the others
      Object.keys(activePopups).forEach(name => {
        if (activePopups[name].content !== document.activeElement) {
          activePopups[name].popup.visible = (name === hotspotName);
          document.getElementById(`popupselect_${name}`).style.display = (name === hotspotName) ? 'block' : 'none';
        }
      });

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

      if (activePopups[hotspotName]) {
        activePopups[hotspotName].popup.visible = false;
      }
    } catch (error) {
      console.error("Error unselecting hotspot:", error);
    }
  };

  function attachHotspotEvents() {
    if (!krpanoInstance) {
      console.warn('krpanoInstance not ready to attach hotspot events. Retrying...');
      setTimeout(attachHotspotEvents, 500);
      return;
    }

    try {
      const hotspots = krpanoInstance.get("hotspot");
      if (hotspots && hotspots.length > 0) {
        for (let i = 0; i < hotspots.length; i++) {
          const hotspot = hotspots[i];
          const hotspotName = hotspot.name;
          callKrpano(`set(hotspot[${hotspotName}].onclick, "js(selectHotspot('${hotspotName}'))")`);
          callKrpano(`set(hotspot[${hotspotName}].oneditstop, "save_hotspot_data('${hotspotName}')")`);
          callKrpano(`set(hotspot[${hotspotName}].onhover, js(showHotspotPopup('${hotspotName}'))")`);
          // callKrpano(`set(hotspot[${hotspotName}].onout, js(hideHotspotPopup('${hotspotName}'))")`);
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
      updateMap();

      loadHotspotsFromFile();

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
        set(layer[popup].visible, false);
      
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
        set(layer[popupcontent].oneditstop, "js(saveHotspotData(get(caller.parent.name.substr(6))))");
      `);

      attachHotspotEvents();

      const viewerTarget = document.getElementById(KRPANO_VIEWER_TARGET_ID);
      if (viewerTarget) {
        viewerTarget.addEventListener("dblclick", onViewerDoubleClick);
      }

      const deleteHotspot = (hotspotName) => {
        fetch(`http://localhost:3001/api/hotspots/${hotspotName}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(response => response.json())
          .then(data => {
            console.log('Hotspot deleted:', data);
            delete hotspotData[hotspotName];
            localStorage.setItem('hotspotData', JSON.stringify(hotspotData));
            updateMap();
          })
          .catch(error => {
            console.error('Error deleting hotspot:', error);
          });
      };

      function removeSelectedHotspot() {
        if (!selectedHotspot) {
          console.warn('No hotspot selected to remove.');
          return;
        }

        try {
          const hotspotName = selectedHotspot.name;
          callKrpano(`removehotspot(${hotspotName})`);

          if (activePopups[hotspotName]) {
            const popupName = `popup_${hotspotName}`;
            const popupContentName = `popupcontent_${hotspotName}`;

            callKrpano(`removelayer(${popupContentName})`);
            callKrpano(`removelayer(${popupName})`);

            delete activePopups[hotspotName];
          }

          deleteHotspot(hotspotName); // Call the delete function

          selectedHotspot = null;
        } catch (error) {
          console.error("Error removing hotspot:", error);
        }
      }


      function removeAllHotspots() {
        try {
          const hotspotNames = Object.keys(hotspotData);
          hotspotNames.forEach(hotspotName => {
            callKrpano(`removehotspot(${hotspotName})`);

            if (activePopups[hotspotName]) {
              const popupName = `popup_${hotspotName}`;
              const popupContentName = `popupcontent_${hotspotName}`;
              callKrpano(`removelayer(${popupContentName})`);
              callKrpano(`removelayer(${popupName})`);
              delete activePopups[hotspotName];
            }

            delete hotspotData[hotspotName];
          });

          localStorage.removeItem('hotspotData');
          selectedHotspot = null;
          updateMap();

        } catch (error) {
          console.error("Error removing all hotspots:", error);
        }
      }

      window.removeAllHotspots = removeAllHotspots;

      document.addEventListener("keydown", (event) => {
        if (event.key === "Delete") {
          removeSelectedHotspot();
        }
      });

      const storedHotspotData = localStorage.getItem('hotspotData');
      if (storedHotspotData) {
        hotspotData = JSON.parse(storedHotspotData);
        Object.keys(hotspotData).forEach(hotspotName => {
          const hotspot = hotspotData[hotspotName];
          addHotspotWithPopup(hotspotName, hotspot.text, hotspot.ath, hotspot.atv);
        });
      }

      callKrpano(`
        addhotspot(youtube_icon);
        set(hotspot[youtube_icon].url, "%SWFPATH%/youtube_icon.png");
        set(hotspot[youtube_icon].ath, 35.3);
        set(hotspot[youtube_icon].atv, 19.8);
        set(hotspot[youtube_icon].scale, 0.010);
        set(hotspot[youtube_icon].onclick, "openurl('https://www.youtube.com/watch?v=xvFZjo5PgG0', '_blank')");
      `);

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
    if (!krpanoInstance) return;

    const x = event.clientX;
    const y = event.clientY;

    const hotspotName = `hotspot_${Date.now()}`;
    const ath = krpanoInstance.screentosphere(x, y).x;
    const atv = krpanoInstance.screentosphere(x, y).y;
    const text = "New Hotspot";

    addHotspotWithPopup(hotspotName, text, ath, atv);

    hotspotData[hotspotName] = {
      text: text,
      ath: ath,
      atv: atv
    };
    saveHotspotData(hotspotName);
    updateMap();
  }

  function updateMap() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      const mapWidth = mapContainer.clientWidth;
      const mapHeight = mapContainer.clientHeight;
      const hotspots = Object.values(hotspotData);
      const root = ReactDOM.createRoot(mapContainer);
      root.render(<MapView hotspots={hotspots} userPosition={userPosition} isLoading={userPositionLoading} />);
    }
  }

  // filepath: /c:/Projects/poi-challenge/360-viewer/src/loadKrpano.js
  function saveHotspotData(hotspotName) {
    const hotspot = krpanoInstance.get(`hotspot[${hotspotName}]`);
    const popupContent = activePopups[hotspotName]?.content;

    if (hotspot && popupContent) {
      const newText = popupContent.html;
      const properties = hotspotData[hotspotName].properties || [];

      // Update hotspot text in krpano
      callKrpano(`set(hotspot[${hotspotName}].text, ${newText})`);

      // Update hotspot data
      hotspotData[hotspotName] = {
        text: newText,
        ath: hotspot.ath,
        atv: hotspot.atv,
        properties: properties
      };

      localStorage.setItem('hotspotData', JSON.stringify(hotspotData));

      fetch('http://localhost:3001/api/hotspots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hotspotData)
      })
        .then(response => response.json())
        .then(data => {
          console.log('Hotspot data saved:', data);
          updateMap();
        })
        .catch(error => {
          console.error('Error saving hotspot data:', error);
        });
    }
  }


  function onKRPanoError(err) {
    console.error("Error embedding krpano", err);
    removepano(KRPANO_VIEWER_ID);
    const target = document.getElementById(KRPANO_VIEWER_TARGET_ID);
    target.remove();
  }

  function removeKrpanoViewer() {
    const krpanoElement = document.getElementById(KRPANO_VIEWER_ID);
    if (krpanoElement) {
      krpanoElement.parentNode.removeChild(krpanoElement);
    }
    krpanoInstance = null;
  }

  removeKrpanoViewer();
  updateMap();

  const options = [
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Safety', label: 'Safety' },
    { value: 'Information', label: 'Information' }
  ];

  function addHotspotWithPopup(hotspotName, text, ath, atv) {
    callKrpano(`addhotspot(${hotspotName})`);
    callKrpano(`set(hotspot[${hotspotName}].type, text)`);
    callKrpano(`set(hotspot[${hotspotName}].text, "${text}")`);
    callKrpano(`set(hotspot[${hotspotName}].ath, ${ath})`);
    callKrpano(`set(hotspot[${hotspotName}].atv, ${atv})`);
    callKrpano(`set(hotspot[${hotspotName}].editable, true)`);
    callKrpano(`set(hotspot[${hotspotName}].onclick, "js(selectHotspot('${hotspotName}'))")`);
    callKrpano(`set(hotspot[${hotspotName}].oneditstop, "save_hotspot_data('${hotspotName}')")`);
    callKrpano(`set(hotspot[${hotspotName}].onhover, js(showHotspotPopup('${hotspotName}'))")`);

    if (!activePopups[hotspotName]) {
      const popupName = `popup_${hotspotName}`;
      const popupContentName = `popupcontent_${hotspotName}`;
      const popupTitleName = `popuptitle_${hotspotName}`;
      const popupSelectName = `popupselect_${hotspotName}`;

      krpanoInstance.call(`
        addlayer(${popupName});
        set(layer[${popupName}].type, container);
        set(layer[${popupName}].align, righttop);
        set(layer[${popupName}].x, -10);
        set(layer[${popupName}].y, 10);
        set(layer[${popupName}].width, 300);
        set(layer[${popupName}].height, 200);
        set(layer[${popupName}].bgcolor, 0xFFFFFF);
        set(layer[${popupName}].bgalpha, 1);
        set(layer[${popupName}].bgborder, 1 0x777777 0.5);
        set(layer[${popupName}].bgroundedge, 7);
        set(layer[${popupName}].bgshadow, 0 4 20 0x000000 0.25);
        set(layer[${popupName}].visible, true);
  
        addlayer(${popupTitleName});
        set(layer[${popupTitleName}].parent, ${popupName});
        set(layer[${popupTitleName}].type, text);
        set(layer[${popupTitleName}].align, lefttop);
        set(layer[${popupTitleName}].html, '<b>POI Comment Section</b>');
        set(layer[${popupTitleName}].width, 100%);
        set(layer[${popupTitleName}].height, 20);
        set(layer[${popupTitleName}].css, color:black; font-size:12px; font-weight: bold; text-align: center;);
        set(layer[${popupTitleName}].bgalpha, 0.0);
        set(layer[${popupTitleName}].y, 0);
  
        addlayer(${popupContentName});
        set(layer[${popupContentName}].parent, ${popupName});
        set(layer[${popupContentName}].type, text);
        set(layer[${popupContentName}].align, lefttop);
        set(layer[${popupContentName}].htmlautosize, true);
        set(layer[${popupContentName}].width, 100%);
        set(layer[${popupContentName}].bgalpha, 0.0);
        set(layer[${popupContentName}].css, color:black; font-size:14px;);
        set(layer[${popupContentName}].editable, true);
        set(layer[${popupContentName}].editenterkey, newline);
        set(layer[${popupContentName}].y, 20);
        set(layer[${popupContentName}].oneditstop, "js(saveHotspotData(get(caller.parent.name.substr(6))))");
      `);

      const popupContent = krpanoInstance.get(`layer[${popupContentName}]`);
      popupContent.html = text;

      const popupSelect = document.createElement('div');
      popupSelect.id = popupSelectName;
      popupSelect.style.position = 'fixed';
      popupSelect.style.top = '220px'; // Position below the popup box
      popupSelect.style.right = '10px';
      popupSelect.style.width = '280px';
      document.body.appendChild(popupSelect);

      const root = ReactDOM.createRoot(popupSelect);
      root.render(
        <Select
          options={options}
          isMulti
          onChange={(selectedOptions) => {
            const selectedValues = selectedOptions.map(option => option.value);
            hotspotData[hotspotName].properties = selectedValues;
            saveHotspotData(hotspotName);
          }}
        />
      );

      activePopups[hotspotName] = {
        popup: krpanoInstance.get(`layer[${popupName}]`),
        content: popupContent,
        select: popupSelect
      };
    }
  }


  fetch("https://api.viewer.immersiondata.com/api/v1/panoramas/311975/krpano.xml")
    .then((res) => res.text())
    .then((xml) => {
      xmlStr = xml;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const nadirHotspotElem = xmlDoc.querySelector("hotspot[name='nadirlogo']");
      nadirHotspotElem.setAttribute('url', './ids-nadir.png');
      const serializer = new XMLSerializer();
      xmlStr = serializer.serializeToString(xmlDoc);

      // eslint-disable-next-line no-undef
      embedpano({
        xml: null,
        html5: "prefer",
        consolelog: true,
        capturetouch: false,
        bgcolor: "#F4F6F8",
        id: KRPANO_VIEWER_ID,
        target: KRPANO_VIEWER_TARGET_ID,
        onready: onKRPanoReady,
        onerror: onKRPanoError,
      });
    })
    .catch(onKRPanoError);
};

window.showHotspotPopup = function (hotspotName) {
  if (!krpanoInstance) return;

  try {
    if (!activePopups[hotspotName]) {
      window.selectHotspot(hotspotName);
    }

    if (activePopups[hotspotName]) {
      activePopups[hotspotName].popup.visible = true;

      // Get current mouse position
      const mouseX = window.event.clientX;
      const mouseY = window.event.clientY;

      // Position the popup near the mouse cursor
      const popupX = mouseX + 10; // Offset slightly to the right
      const popupY = mouseY + 10; // Offset slightly below

      krpanoInstance.call(`set(layer[popup_${hotspotName}].x, ${popupX});`);
      krpanoInstance.call(`set(layer[popup_${hotspotName}].y, ${popupY});`);
    }
  } catch (error) {
    console.error("Error showing hotspot popup:", error);
  }
};

window.hideHotspotPopup = function (hotspotName) {
  if (activePopups[hotspotName]) {
    activePopups[hotspotName].popup.visible = false;
  }
};

export default loadKrpano;