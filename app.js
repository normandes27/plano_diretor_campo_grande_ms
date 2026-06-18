window.GM_CONFIG = {"title": "Plano Diretor de Campo Grande MS", "description": "Dados para PRAD em área urbana", "crsName": "EPSG:31981 — SIRGAS 2000 / UTM zone 21S", "basemap": "satellite", "colors": {"primary": "#2c7fb8", "accent": "#f03b20"}, "logo": "assets/logo.png", "controls": {"zoom": true, "pan": true, "scale": true, "legend": true, "layers": true, "locate": true, "measure": true, "fullscreen": true, "minimap": true}, "bounds": [[-20.628805563908404, -54.76016828843029], [-20.278515168826328, -54.22439352847635]], "layers": [{"id": "CO2FLUX_PROXY_S2_SR_20260101_20260610_s10_90209003_2adf_4708_8747_8dd205a4062c", "name": "CO2FLUX_PROXY_S2_SR_20260101_20260610_s10", "kind": "raster", "image": "data/raster_0.png", "bounds": [[-20.50602265365314, -54.615053991671374], [-20.50314804474396, -54.60750814328477]], "opacity": 1.0, "visible": true}, {"id": "DEclividade_Percentual_c0d572c7_0abd_46de_b31a_cceb15fe681c", "name": "DEclividade_Percentual", "kind": "raster", "image": "data/raster_1.png", "bounds": [[-20.58911505397694, -54.763481520857624], [-20.369987579117428, -54.501295718964336]], "opacity": 1.0, "visible": true}, {"id": "MDT_curvas_plano_diretor_campo_grande_EPSG31981_20m_34ba38a5_c0ac_41ec_87bc_90fca6fc5f7c", "name": "MDT_curvas_plano_diretor_campo_grande_EPSG31981_20m", "kind": "raster", "image": "data/raster_2.png", "bounds": [[-21.00231590234997, -54.76856462964288], [-20.215760413955696, -54.49217466417031]], "opacity": 1.0, "visible": true}, {"id": "Hidrografia_2b2814e9_38f9_4d54_aa93_06934c304257", "name": "Hidrografia", "kind": "vector", "src": "data/layer_3.js", "dataVar": "GM_LAYER_3", "style": {"geom": "line", "mode": "single", "field": null, "single": {"fill": "#b7484b", "fillOpacity": 1.0, "stroke": "#b7484b", "weight": 1, "opacity": 1.0, "radius": 6}, "categories": []}, "popupFields": ["OBJECTID", "BACIA", "CORREGO", "DISTANCIA", "SHAPE_LEN"], "visible": true}, {"id": "Google_Satellite_Hybrid_18086bda_847a_4f26_ad97_876d151f5448", "name": "Google Satellite Hybrid", "kind": "raster", "image": "data/raster_4.png", "bounds": [[-85.0511287798066, -180.0], [85.0511287798066, 180.0]], "opacity": 1.0, "visible": true}]};


(function () {
    var cfg = window.GM_CONFIG;

    var map = L.map('map', {
        zoomControl: !!cfg.controls.zoom,
        dragging: cfg.controls.pan !== false,
        fullscreenControl: false
    });

    // --- Mapa base ---
    var basemaps = {
        osm: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            opts: { maxZoom: 19, attribution: '&copy; OpenStreetMap' }
        },
        positron: {
            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            opts: { maxZoom: 20, attribution: '&copy; OpenStreetMap, &copy; CARTO' }
        },
        dark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            opts: { maxZoom: 20, attribution: '&copy; OpenStreetMap, &copy; CARTO' }
        },
        topo: {
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            opts: { maxZoom: 17, attribution: '&copy; OpenTopoMap (CC-BY-SA)' }
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            opts: { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
        }
    };
    var baseLayer = null;
    if (cfg.basemap && cfg.basemap !== 'none' && basemaps[cfg.basemap]) {
        var b = basemaps[cfg.basemap];
        baseLayer = L.tileLayer(b.url, b.opts).addTo(map);
    }

    // --- Estilos ---
    // Cada elemento trae su propio estilo en properties._gm (calculado por el
    // renderizador real de QGIS). Si no, se usa el estilo único de la capa.
    function featStyle(lc, feature) {
        var s = (feature && feature.properties && feature.properties._gm)
            ? feature.properties._gm
            : (lc.style && lc.style.single) || {};
        return {
            color: s.stroke, weight: s.weight, opacity: s.opacity,
            fillColor: s.fill, fillOpacity: s.fillOpacity,
            radius: s.radius || 6
        };
    }

    function popupHtml(feature, fields) {
        if (!feature || !feature.properties) { return ''; }
        var rows = '';
        for (var i = 0; i < fields.length; i++) {
            var k = fields[i];
            if (k === '_gm') { continue; }
            var val = feature.properties[k];
            if (val === null || val === undefined) { val = ''; }
            rows += '<tr><td class="k">' + k + '</td><td>' + String(val) + '</td></tr>';
        }
        return '<table>' + rows + '</table>';
    }

    // --- Capas ---
    var overlays = {};
    cfg.layers.forEach(function (lc) {
        var layer;
        if (lc.kind === 'raster') {
            layer = L.imageOverlay(lc.image, lc.bounds, { opacity: lc.opacity });
        } else {
            var data = window[lc.dataVar];
            if (!data) { return; }
            layer = L.geoJSON(data, {
                style: function (f) { return featStyle(lc, f); },
                pointToLayer: function (f, latlng) {
                    var st = featStyle(lc, f);
                    return L.circleMarker(latlng, {
                        radius: st.radius,
                        color: st.color, weight: st.weight, opacity: st.opacity,
                        fillColor: st.fillColor, fillOpacity: st.fillOpacity
                    });
                },
                onEachFeature: function (f, lyr) {
                    var html = popupHtml(f, lc.popupFields || []);
                    if (html) { lyr.bindPopup(html); }
                }
            });
        }
        if (lc.visible !== false) { layer.addTo(map); }
        overlays[lc.name] = layer;
    });

    // --- Encuadre: mismo zoom y límites de la vista de QGIS ---
    if (cfg.bounds) {
        map.fitBounds(cfg.bounds);
    } else {
        map.setView([0, 0], 2);
    }

    // --- Controles ---
    if (cfg.controls.scale) {
        L.control.scale({ imperial: false }).addTo(map);
    }
    if (cfg.controls.layers && Object.keys(overlays).length) {
        var bases = {};
        if (baseLayer) { bases['Mapa base'] = baseLayer; }
        L.control.layers(bases, overlays, { collapsed: true }).addTo(map);
    }
    if (cfg.controls.fullscreen && L.control.fullscreen) {
        L.control.fullscreen({ title: 'Pantalla completa' }).addTo(map);
    }
    if (cfg.controls.locate && L.control.locate) {
        L.control.locate({
            position: 'topleft',
            strings: { title: 'Mi ubicación (GPS)' },
            flyTo: true
        }).addTo(map);
    }
    if (cfg.controls.measure && L.control.measure) {
        L.control.measure({
            primaryLengthUnit: 'meters', secondaryLengthUnit: 'kilometers',
            primaryAreaUnit: 'sqmeters', secondaryAreaUnit: 'hectares',
            activeColor: cfg.colors.accent, completedColor: cfg.colors.primary,
            localization: 'es'
        }).addTo(map);
    }
    if (cfg.controls.minimap && L.Control && L.Control.MiniMap && baseLayer) {
        var b2 = (function () {
            var bm = basemaps[cfg.basemap] || basemaps.osm;
            return L.tileLayer(bm.url, bm.opts);
        })();
        new L.Control.MiniMap(b2, { toggleDisplay: true }).addTo(map);
    }

    // --- Título ---
    if (cfg.title) {
        var titleCtl = L.control({ position: 'topright' });
        titleCtl.onAdd = function () {
            var d = L.DomUtil.create('div', 'gm-title');
            d.textContent = cfg.title;
            return d;
        };
        titleCtl.addTo(map);
    }

    // --- Leyenda / simbología ---
    if (cfg.controls.legend) {
        var legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            var d = L.DomUtil.create('div', 'gm-legend');
            var html = '<h4>Leyenda</h4>';
            cfg.layers.forEach(function (lc) {
                if (lc.kind === 'raster') {
                    html += '<div class="row"><span class="swatch" style="background:repeating-linear-gradient(45deg,#bbb,#bbb 4px,#ddd 4px,#ddd 8px)"></span>' + lc.name + '</div>';
                    return;
                }
                var ls = lc.style;
                if (ls.mode === 'categorized' && ls.categories.length) {
                    html += '<div style="font-weight:600;margin-top:4px">' + lc.name + '</div>';
                    ls.categories.forEach(function (c) {
                        html += '<div class="row"><span class="swatch" style="background:' + c.fill + '"></span>' + (c.label || c.value) + '</div>';
                    });
                } else {
                    html += '<div class="row"><span class="swatch" style="background:' + ls.single.fill + '"></span>' + lc.name + '</div>';
                }
            });
            d.innerHTML = html;
            L.DomEvent.disableClickPropagation(d);
            return d;
        };
        legend.addTo(map);
    }

    // --- Logo ---
    if (cfg.logo) {
        var logo = L.control({ position: 'bottomleft' });
        logo.onAdd = function () {
            var d = L.DomUtil.create('div', 'gm-logo');
            d.innerHTML = '<img src="' + cfg.logo + '" alt="logo"/>';
            return d;
        };
        logo.addTo(map);
    }
})();
