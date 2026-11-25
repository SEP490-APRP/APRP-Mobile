import { ENV } from '@/utils/env'
import type { DeliveryPhase, LatLng } from '../utils/trackingRules'

/** Trạng thái app gửi xuống trang bản đồ mỗi lần có thay đổi */
export interface MapState {
  shop: LatLng
  dest: LatLng
  /** null khi xe đang ẩn với vai trò này hoặc chưa có vị trí */
  shipper: LatLng | null
  heading: number
  phase: DeliveryPhase
  routes: { toShop: boolean; toBuyer: boolean }
  /** Tuyến đường đồng bộ trực tiếp từ DemoGpsControl để xe chạy khớp 100% đường vẽ */
  demoRoute?: LatLng[] | null
  /** Bám theo xe; tắt khi người dùng tự kéo bản đồ */
  follow: boolean
  /** Tăng lên để yêu cầu căn lại khung nhìn */
  recenter: number
}

export type MapEvent = { type: 'ready' } | { type: 'userMoved' } | { type: 'error'; message: string }

/**
 * Trang Leaflet chạy trong WebView (native) hoặc iframe (web). Dùng bản đồ nền Google Maps
 * (kèm API key đồng bộ từ FE) với fallback OpenStreetMap và OSRM để vẽ tuyến lộ trình.
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
  var gKey = '${ENV.GOOGLE_MAPS_API_KEY}';
  var googleUrl = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}' + (gKey ? '&key=' + encodeURIComponent(gKey) : '');
  var baseLayer = L.tileLayer(googleUrl, {
    maxZoom: 20,
    subdomains: '0123',
    attribution: '&copy; Google Maps'
  }).addTo(map);

  baseLayer.on('tileerror', function () {
    if (!map.__osmFallback) {
      map.__osmFallback = true;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    }
  });
  map.on('dragstart', function () { send({ type: 'userMoved' }); });

  function pin(cls, emoji) {
    return L.divIcon({ className: '', html: '<div class="pin ' + cls + '">' + emoji + '</div>', iconSize: [38, 38], iconAnchor: [19, 19] });
  }
  function bikeIcon(h) {
    return L.divIcon({ className: '', iconSize: [46, 46], iconAnchor: [23, 23], html:
      '<svg class="bike" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#00B14F" stroke="#fff" stroke-width="3"/>' +
      '<g class="bike-rot" transform="rotate(' + h + ',24,24)"><polygon points="24,5 29,13 19,13" fill="#fff"/>' +
      '<g transform="translate(13,14) scale(0.9)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="4" cy="11" r="3"/><circle cx="18" cy="11" r="3"/><path d="M4 11l4-6h5l2 3h3"/><path d="M12 5l-2 6h5"/></g></g></svg>' });
  }

  var shopMarker = null, destMarker = null, bike = null;
  var buyerLine = null, shopLine = null, buyerPts = null, shopPts = null, buyerKey = '', shopKey = '', shopFetched = false;
  var shown = null, lastTarget = null, anim = null, lastRecenter = -1, first = true, state = null;
  var lastPanTime = 0, lastMoveTime = 0, lastHeading = 0, lastTrimTime = 0;

  function routeKey(a, b) { return [a.lat, a.lng, b.lat, b.lng].map(function (n) { return n.toFixed(5); }).join(','); }
  function calcBearing(a, b) {
    var rad = Math.PI / 180;
    var lat1 = a.lat * rad, lat2 = b.lat * rad, dLng = (b.lng - a.lng) * rad;
    var y = Math.sin(dLng) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return ((Math.atan2(y, x) / rad) + 360) % 360;
  }
  function resample(pts, stepDeg) {
    if (!pts || pts.length <= 1) return pts || [];
    var out = [pts[0]], carry = 0, step = stepDeg || 0.00032;
    for (var i = 1; i < pts.length; i++) {
      var prev = pts[i - 1], curr = pts[i];
      var seg = Math.hypot(curr.lat - prev.lat, curr.lng - prev.lng);
      if (seg < 1e-6) continue;
      while (carry + seg >= step) {
        var need = step - carry, t = need / seg;
        var next = { lat: prev.lat + (curr.lat - prev.lat) * t, lng: prev.lng + (curr.lng - prev.lng) * t };
        out.push(next);
        prev = next;
        seg -= need;
        carry = 0;
      }
      carry += seg;
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function routeOnce(a, b) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    var url = 'https://router.project-osrm.org/route/v1/driving/' + a.lng + ',' + a.lat + ';' + b.lng + ',' + b.lat + '?overview=full&geometries=geojson';
    return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) { return r.json(); }).then(function (d) {
      clearTimeout(t);
      var c = d && d.routes && d.routes[0] && d.routes[0].geometry && d.routes[0].geometry.coordinates;
      return c && c.length ? resample(c.map(function (p) { return { lat: p[1], lng: p[0] }; }), 0.00032) : [];
    }).catch(function () { clearTimeout(t); return []; });
  }
  function route(a, b) {
    return routeOnce(a, b).then(function (pts) {
      return pts.length ? pts : routeOnce(a, b);
    });
  }
  function toLL(pts) { return pts.map(function (p) { return [p.lat, p.lng]; }); }
  function closestInfo(pts, p) {
    var best = 0, min = Infinity;
    for (var i = 0; i < pts.length; i++) {
      var d = Math.pow(pts[i].lat - p.lat, 2) + Math.pow(pts[i].lng - p.lng, 2);
      if (d < min) { min = d; best = i; }
    }
    return { idx: best, dist: Math.sqrt(min) };
  }
  function sliceAhead(pts, pos) {
    var info = closestInfo(pts, pos);
    var idx = info.idx;
    if (idx < pts.length - 1) {
      var a = pts[idx], b = pts[idx + 1];
      var dot = (pos.lat - a.lat) * (b.lat - a.lat) + (pos.lng - a.lng) * (b.lng - a.lng);
      if (dot > 0) idx = idx + 1;
    }
    return [[pos.lat, pos.lng]].concat(toLL(pts.slice(idx)));
  }

  function trimBuyerLine(pos) {
    if (!buyerLine || !buyerPts || !buyerPts.length) return;
    // Chỉ cắt tuyến Shop -> Khách khi đã sang chặng TO_BUYER; khi đang đi tới Shop giữ nguyên tuyến.
    var isToBuyer = state && state.phase === 'TO_BUYER';
    if (!pos || !isToBuyer) { buyerLine.setLatLngs(toLL(buyerPts)); return; }
    buyerLine.setLatLngs(sliceAhead(buyerPts, pos));
  }

  function trimShopLine(pos) {
    if (!shopLine || !shopPts || !shopPts.length) return;
    if (!pos || (state && state.phase !== 'TO_SHOP')) { shopLine.setLatLngs([]); return; }
    shopLine.setLatLngs(sliceAhead(shopPts, pos));
  }

  function rotateBike(h) {
    if (!bike) return;
    var el = bike.getElement();
    var rot = el && el.querySelector && el.querySelector('.bike-rot');
    if (rot) rot.setAttribute('transform', 'rotate(' + h + ',24,24)');
  }

  function safelyPan(pos) {
    if (!state || !state.follow) return;
    map.panTo([pos.lat, pos.lng], { animate: false });
  }

  function moveBike(to, fallbackHeading) {
    if (!bike) {
      lastHeading = fallbackHeading || 0;
      bike = L.marker([to.lat, to.lng], { icon: bikeIcon(lastHeading), zIndexOffset: 1000 }).addTo(map);
      shown = to;
      lastTarget = to;
      lastMoveTime = Date.now();
      return;
    }
    if (lastTarget && Math.abs(to.lat - lastTarget.lat) < 1e-6 && Math.abs(to.lng - lastTarget.lng) < 1e-6) {
      return;
    }
    lastTarget = to;
    var from = shown || to;
    var dist = Math.hypot(to.lat - from.lat, to.lng - from.lng);
    if (dist > 0.00002) {
      lastHeading = calcBearing(from, to);
      rotateBike(lastHeading);
    }
    var now = Date.now();
    var dt = lastMoveTime ? (now - lastMoveTime) : 1000;
    lastMoveTime = now;
    if (anim) cancelAnimationFrame(anim);
    // Nếu xe nhảy cóc khoảng cách lớn (>330m, VD bắt đầu Fake GPS từ vị trí cũ), snap ngay thay vì bay xuyên nhà.
    if (dist > 0.003) {
      shown = to;
      bike.setLatLng([to.lat, to.lng]);
      trimBuyerLine(shown);
      trimShopLine(shown);
      safelyPan(shown);
      return;
    }
    var dur = Math.max(250, Math.min(1800, dt * 0.98));
    var start = now;
    (function step() {
      var curNow = Date.now();
      var k = Math.min(1, (curNow - start) / dur);
      shown = { lat: from.lat + (to.lat - from.lat) * k, lng: from.lng + (to.lng - from.lng) * k };
      bike.setLatLng([shown.lat, shown.lng]);
      if (curNow - lastTrimTime >= 120 || k >= 1) {
        lastTrimTime = curNow;
        trimBuyerLine(shown);
        trimShopLine(shown);
      }
      safelyPan(shown);
      if (k < 1) anim = requestAnimationFrame(step);
      else anim = null;
    })();
  }

  function frame(s) {
    if (s.shipper) { map.setView([s.shipper.lat, s.shipper.lng], 16); return; }
    var pts = [];
    if (s.routes.toShop) pts.push([s.shop.lat, s.shop.lng]);
    if (s.routes.toBuyer) { pts.push([s.shop.lat, s.shop.lng]); pts.push([s.dest.lat, s.dest.lng]); }
    if (pts.length === 1) map.setView(pts[0], 16);
    else map.fitBounds(pts, { paddingTopLeft: [40, 80], paddingBottomRight: [40, 220] });
  }

  function setShopRoute(pts) {
    shopPts = pts;
    if (shopLine) { map.removeLayer(shopLine); shopLine = null; }
    if (pts && pts.length) {
      shopLine = L.polyline(toLL(pts), { color: '#EA580C', weight: 6, opacity: 0.85 }).addTo(map);
      trimShopLine(shown || (state && state.shipper));
    }
  }

  function setBuyerRoute(pts) {
    buyerPts = pts;
    if (buyerLine) { map.removeLayer(buyerLine); buyerLine = null; }
    if (pts && pts.length) {
      buyerLine = L.polyline(toLL(pts), { color: '#00B14F', weight: 6, opacity: 0.85 }).addTo(map);
      trimBuyerLine(state && state.shipper ? shown : null);
    }
  }

  window.__capnong = function (s) {
    state = s;
    if (!shopMarker) shopMarker = L.marker([s.shop.lat, s.shop.lng], { icon: pin('shop', '🏪') }).addTo(map);
    else shopMarker.setLatLng([s.shop.lat, s.shop.lng]);

    if (s.routes.toBuyer) {
      if (!destMarker) destMarker = L.marker([s.dest.lat, s.dest.lng], { icon: pin('home', '🏠') }).addTo(map);
      else destMarker.setLatLng([s.dest.lat, s.dest.lng]);

      if (s.phase === 'TO_BUYER' && s.demoRoute && s.demoRoute.length > 1) {
        var dk = routeKey(s.demoRoute[0], s.demoRoute[s.demoRoute.length - 1]) + ':' + s.demoRoute.length;
        if (dk !== buyerKey) {
          buyerKey = dk;
          setBuyerRoute(s.demoRoute);
        } else {
          trimBuyerLine(s.shipper ? shown : null);
        }
      } else {
        var bk = routeKey(s.shop, s.dest);
        if (bk !== buyerKey) {
          buyerKey = bk;
          route(s.shop, s.dest).then(function (pts) {
            if (bk !== buyerKey) return;
            setBuyerRoute(pts);
          });
        } else {
          trimBuyerLine(s.shipper ? shown : null);
        }
      }
    }

    var showToShop = s.routes.toShop && s.shipper && s.phase === 'TO_SHOP';
    if (showToShop) {
      if (s.demoRoute && s.demoRoute.length > 1) {
        var sk = routeKey(s.demoRoute[0], s.demoRoute[s.demoRoute.length - 1]) + ':' + s.demoRoute.length;
        if (sk !== shopKey) {
          shopKey = sk;
          shopFetched = true;
          setShopRoute(s.demoRoute);
        } else {
          trimShopLine(s.shipper ? shown : null);
        }
      } else {
        var offRoute = shopPts && shopPts.length ? closestInfo(shopPts, s.shipper).dist > 0.0025 : false;
        if ((!shopFetched && !shopPts) || offRoute) {
          shopFetched = true;
          route(s.shipper, s.shop).then(function (pts) {
            if (state && state.phase === 'TO_SHOP') setShopRoute(pts);
          });
        }
      }
    } else {
      shopFetched = false;
      shopKey = '';
      if (shopLine) { map.removeLayer(shopLine); shopLine = null; shopPts = null; }
    }

    if (s.shipper) moveBike(s.shipper, s.heading);
    else if (bike) { map.removeLayer(bike); bike = null; shown = null; lastTarget = null; trimBuyerLine(null); }

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
