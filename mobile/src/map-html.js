// The map receives only public restaurant coordinates and aggregate result counts.
// Menu names are serialized as data, then inserted with textContent in the frame.
const jsonForScript = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export function validMapCoordinates(value) {
  return (
    !!value &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.latitude) <= 90 &&
    Math.abs(value.longitude) <= 180
  );
}

export function buildMapHtml({ markers, center, channel }) {
  const payload = jsonForScript({ markers, center, channel });
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<meta name="referrer" content="strict-origin-when-cross-origin"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com; img-src data: https://tile.openstreetmap.org https://unpkg.com; base-uri 'none'; form-action 'none'"/>
<title>Verifed restaurant map</title>
<script id="map-data" type="application/json">${payload}</script>
<script>
(function(){
  var channel = JSON.parse(document.getElementById('map-data').textContent).channel;
  window.reportMap = function(type, id){
    var message = JSON.stringify({ channel: channel, type: type, id: id });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
    else window.parent.postMessage(message, '*');
  };
  window.failMap = function(){ window.reportMap('error'); };
})();
</script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
 integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" onerror="failMap()"/>
<script defer src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
 integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="" onerror="failMap()"></script>
<style>
html,body,#map{height:100%;width:100%;margin:0;background:#eaf0de;font-family:Arial,sans-serif}
.leaflet-container{background:#eaf0de;font-family:Arial,sans-serif}
.restaurant-pin{background:none;border:0}
.restaurant-pin span{display:flex;align-items:center;justify-content:center;width:29px;height:29px;
 border-radius:50% 50% 50% 8px;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px #263d3455}
.restaurant-pin b{transform:rotate(45deg);color:white;font:700 12px Arial,sans-serif}
.pin-reported span{background:#275d47}.pin-possible span{background:#bc4516}.pin-menu span{background:#646d61}
.leaflet-control-attribution{font-size:10px;max-width:240px;line-height:14px}
.leaflet-tooltip{white-space:normal;max-width:190px;font-size:12px}
</style></head><body><div id="map" aria-label="Restaurant map"></div>
<script>
window.addEventListener('load', function(){
 try {
  if (!window.L) return failMap();
  var data = JSON.parse(document.getElementById('map-data').textContent);
  var start = data.center || {latitude:28.5383,longitude:-81.3792};
  var map = L.map('map', {scrollWheelZoom:false, zoomControl:true}).setView([start.latitude,start.longitude],12);
  var tileLoaded = false;
  var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
  });
  tiles.on('tileload',function(){
    if (!tileLoaded) { tileLoaded = true; reportMap('ready'); }
  });
  tiles.addTo(map);
  var bounds = [];
  data.markers.forEach(function(row,index){
    var position = [row.latitude,row.longitude];
    var tone = row.supportedCount > 0 ? 'reported' : row.possibleCount > 0 ? 'possible' : 'menu';
    var icon = L.divIcon({className:'restaurant-pin pin-'+tone,
      html:'<span><b>'+(index+1)+'</b></span>',iconSize:[32,38],iconAnchor:[16,32]});
    var marker = L.marker(position,{icon:icon,keyboard:true,title:row.name,alt:row.name}).addTo(map);
    var label = document.createElement('div');
    label.textContent = row.name + (row.supportedCount > 0 ? ' · '+row.supportedCount+' reported matches' :
      row.possibleCount > 0 ? ' · '+row.possibleCount+' possible options; confirm ingredients' : ' · view menu');
    marker.bindTooltip(label,{direction:'top'});
    marker.on('click',function(){ reportMap('select',row.id); });
    if (marker.getElement()) marker.getElement().setAttribute('aria-label','Open '+row.name+' menu');
    bounds.push(position);
  });
  if(data.center){
    var point = L.circleMarker([start.latitude,start.longitude], {radius:6,color:'#285D82',fillColor:'#78B7D9',fillOpacity:1,weight:2}).addTo(map);
    var label = document.createElement('span'); label.textContent = start.label || 'Search area'; point.bindTooltip(label);
    bounds.push([start.latitude,start.longitude]);
  }
  if(bounds.length > 1) map.fitBounds(bounds,{padding:[28,28],maxZoom:14});
  else if(bounds.length === 1) map.setView(bounds[0],14);
  setTimeout(function(){if(!tileLoaded) failMap();},14000);
  window.addEventListener('pagehide',function(){map.remove();},{once:true});
 } catch(error) { failMap(); }
});
</script></body></html>`;
}
