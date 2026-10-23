import type { LatLng } from '../utils/trackingRules'

/** Trạng thái app gửi xuống trang bản đồ mỗi lần có thay đổi */
export interface MapState {
  shop: LatLng
  dest: LatLng
  /** null khi xe đang ẩn với vai trò này hoặc chưa có vị trí */
  shipper: LatLng | null
  heading: number
  routes: { toShop: boolean; toBuyer: boolean }
  /** Bám theo xe; tắt khi người dùng tự kéo bản đồ */
  follow: boolean
  /** Tăng lên để yêu cầu căn lại khung nhìn */
  recenter: number
}

export type MapEvent = { type: 'ready' } | { type: 'userMoved' } | { type: 'error'; message: string }

/**
 * Trang Leaflet chạy trong WebView (native) hoặc iframe (web). Dùng bản đồ nền CARTO
 * (dữ liệu OpenStreetMap, không cần API key) và OSRM để vẽ tuyến, giống chế độ dự phòng của web.
 * App gọi window.__capnong(state) hoặc postMessage(state); trang báo ngược qua MapEvent.
 */
export const MAP_HTML = `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin: 0; height: 100%; width: 100%; background: #eef2ea; }
  .pin { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;
    border-radius: 19px; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.35); font-size: 18px; }
  .pin.shop { background: #7c3aed; }
  .pin.home { background: #e11d48; }
  .bike { width: 46px; height: 46px; }
  .leaflet-control-attribution { font-size: 9px; }
</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  function send(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent && window.parent !== window) window.parent.postMessage({ capnongMap: msg }, '*');
  }
  if (!window.L) { send({ type: 'error', message: 'Không tải được thư viện bản đồ' }); return; }

  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([10.81, 106.71], 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);
  map.on('dragstart', function () { send({ type: 'userMoved' }); });

  function pin(cls, emoji) {
    return L.divIcon({ className: '', html: '<div class="pin ' + cls + '">' + emoji + '</div>', iconSize: [38, 38], iconAnchor: [19, 19] });
  }
  function bikeIcon(h) {
    return L.divIcon({ className: '', iconSize: [46, 46], iconAnchor: [23, 23], html:
      '<svg class="bike" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#00B14F" stroke="#fff" stroke-width="3"/>' +
      '<g transform="rotate(' + h + ',24,24)"><polygon points="24,5 29,13 19,13" fill="#fff"/>' +
      '<g transform="translate(13,14) scale(0.9)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="4" cy="11" r="3"/><circle cx="18" cy="11" r="3"/><path d="M4 11l4-6h5l2 3h3"/><path d="M12 5l-2 6h5"/></g></g></svg>' });
  }

  var shopMarker = null, destMarker = null, bike = null;
  var buyerLine = null, shopLine = null, buyerPts = null, buyerKey = '', shopKey = '';
  var shown = null, anim = null, lastRecenter = -1, first = true, state = null;

  function routeKey(a, b) { return [a.lat, a.lng, b.lat, b.lng].map(function (n) { return n.toFixed(5); }).join(','); }
  function straight(a, b) {
    var out = []; for (var i = 0; i <= 25; i++) out.push({ lat: a.lat + (b.lat - a.lat) * i / 25, lng: a.lng + (b.lng - a.lng) * i / 25 }); return out;
  }
  function route(a, b) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 3500);
    var url = 'https://router.project-osrm.org/route/v1/driving/' + a.lng + ',' + a.lat + ';' + b.lng + ',' + b.lat + '?overview=full&geometries=geojson';
    return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) { return r.json(); }).then(function (d) {
      clearTimeout(t);
      var c = d && d.routes && d.routes[0] && d.routes[0].geometry && d.routes[0].geometry.coordinates;
      return c && c.length ? c.map(function (p) { return { lat: p[1], lng: p[0] }; }) : straight(a, b);
    }).catch(function () { clearTimeout(t); return straight(a, b); });
  }
  function toLL(pts) { return pts.map(function (p) { return [p.lat, p.lng]; }); }
  function closest(pts, p) {
    var best = 0, min = Infinity;
    for (var i = 0; i < pts.length; i++) { var d = Math.pow(pts[i].lat - p.lat, 2) + Math.pow(pts[i].lng - p.lng, 2); if (d < min) { min = d; best = i; } }
    return best;
  }

  function trimBuyerLine(pos) {
    if (!buyerLine || !buyerPts) return;
    if (!pos) { buyerLine.setLatLngs(toLL(buyerPts)); return; }
    var rest = buyerPts.slice(closest(buyerPts, pos));
    buyerLine.setLatLngs([[pos.lat, pos.lng]].concat(toLL(rest)));
  }

  function moveBike(to, heading) {
    if (!bike) {
      bike = L.marker([to.lat, to.lng], { icon: bikeIcon(heading), zIndexOffset: 1000 }).addTo(map);
      shown = to; return;
    }
    bike.setIcon(bikeIcon(heading));
    var from = shown || to, start = Date.now(), dur = 900;
    if (anim) cancelAnimationFrame(anim);
    (function step() {
      var k = Math.min(1, (Date.now() - start) / dur);
      shown = { lat: from.lat + (to.lat - from.lat) * k, lng: from.lng + (to.lng - from.lng) * k };
      bike.setLatLng([shown.lat, shown.lng]);
      trimBuyerLine(shown);
      if (state && state.follow) map.panTo([shown.lat, shown.lng], { animate: false });
      if (k < 1) anim = requestAnimationFrame(step);
    })();
  }

  function frame(s) {
    if (s.shipper) { map.setView([s.shipper.lat, s.shipper.lng], 16); return; }
    var pts = [];
    if (s.routes.toShop) pts.push([s.shop.lat, s.shop.lng]);
    if (s.routes.toBuyer) { pts.push([s.shop.lat, s.shop.lng]); pts.push([s.dest.lat, s.dest.lng]); }
    if (pts.length === 1) map.setView(pts[0], 16);
    else map.fitBounds(pts, { padding: [70, 70] });
  }

  window.__capnong = function (s) {
    state = s;
    if (!shopMarker) shopMarker = L.marker([s.shop.lat, s.shop.lng], { icon: pin('shop', '🏪') }).addTo(map);
    else shopMarker.setLatLng([s.shop.lat, s.shop.lng]);
    if (s.routes.toBuyer) {
      if (!destMarker) destMarker = L.marker([s.dest.lat, s.dest.lng], { icon: pin('home', '🏠') }).addTo(map);
      else destMarker.setLatLng([s.dest.lat, s.dest.lng]);
      var bk = routeKey(s.shop, s.dest);
      if (bk !== buyerKey) {
        buyerKey = bk;
        route(s.shop, s.dest).then(function (pts) {
          if (bk !== buyerKey) return;
          buyerPts = pts;
          if (buyerLine) map.removeLayer(buyerLine);
          buyerLine = L.polyline(toLL(pts), { color: '#00B14F', weight: 6, opacity: 0.85 }).addTo(map);
          trimBuyerLine(state && state.shipper ? shown : null);
        });
      }
    }
    if (s.routes.toShop && s.shipper) {
      // Chặng Shipper ➔ Shop chỉ vẽ lại khi xe đi lệch đáng kể so với lần trước.
      var sk = routeKey({ lat: Math.round(s.shipper.lat * 500) / 500, lng: Math.round(s.shipper.lng * 500) / 500 }, s.shop);
      if (sk !== shopKey) {
        shopKey = sk;
        route(s.shipper, s.shop).then(function (pts) {
          if (sk !== shopKey) return;
          if (shopLine) map.removeLayer(shopLine);
          shopLine = L.polyline(toLL(pts), { color: '#EA580C', weight: 6, opacity: 0.85, dashArray: '1 10', lineCap: 'round' }).addTo(map);
        });
      }
    } else if (shopLine) { map.removeLayer(shopLine); shopLine = null; shopKey = ''; }

    if (s.shipper) moveBike(s.shipper, s.heading);
    else if (bike) { map.removeLayer(bike); bike = null; shown = null; trimBuyerLine(null); }

    if (first || s.recenter !== lastRecenter) { frame(s); first = false; lastRecenter = s.recenter; }
  };

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) { return; } }
    if (d && d.shop && d.dest) window.__capnong(d);
  });
  send({ type: 'ready' });
})();
</script>
</body></html>`
