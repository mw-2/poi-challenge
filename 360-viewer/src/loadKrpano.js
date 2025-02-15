const KRPANO_VIEWER_TARGET_ID = "krpano-target";
const KRPANO_VIEWER_ID = "krpano-viewer";

const loadKrpano = () => {
  let xmlStr;

  function onKRPanoReady(krpano) {
    try {
      krpano.call(`loadxml(${xmlStr})`);
      
      var secondHotspot = krpano.addhotspot(null);
      secondHotspot.name = "secondHotspot"; // Ensure the hotspot has a name
      secondHotspot.type = "text";
      secondHotspot.text = "Second Hotspot";
      secondHotspot.ath = 40;
      secondHotspot.atv = 20;
      secondHotspot.onclick = function() {
        const x = krpano.get("mouse.x");
        const y = krpano.get("mouse.y");
        const coordinateDisplay = document.getElementById("coordinateDisplay");
        coordinateDisplay.innerText = `Coordinates: x=${x}, y=${y}`;
      };
    
    } catch (err) {
      console.error("Error loading krpano xml", err);
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
      const nadirHotspotElem = xmlDoc.querySelector("hotspot[name='nadirlogo'");
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