"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, NavIcon } from "@/components/ui/Icon";

const S = {
  bg:     "#07090f",
  panel:  "#0c1018",
  panel2: "#111620",
  border: "#1a2030",
  border2:"#263040",
  cyan:   "#00d4ff",
  green:  "#00e676",
  yellow: "#ffd740",
  red:    "#ff5252",
  purple: "#ce93d8",
  orange: "#ff9800",
  text:   "#cdd6e8",
  text2:  "#7a8aa0",
  text3:  "#648099",
  mono:   "'Share Tech Mono', 'Courier New', monospace",
} as const;

const SEVERITY_COLOR: Record<string, string> = {
  critical: S.red,
  warning:  S.yellow,
  safe:     S.green,
};

interface Incident {
  id: string;
  severity: string;
  status: string;
  name: string;
  lon: number;
  lat: number;
  location: string;
  entity: string;
  gsi: number;
  division: string;
  desc: string;
  time: string;
  cityCode: string;
  cityName: string;
}

interface MapData {
  incidents: Incident[];
  cityCounts: Record<string, number>;
  centroids: Record<string, [number, number]>;
  cityNames: Record<string, string>;
}

export function MapClient() {
  const mapRef    = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const [mapData, setMapData]   = useState<MapData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const router = useRouter();

  // データ取得
  useEffect(() => {
    fetch("/api/incidents", { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(r => r.json())
      .then(setMapData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Leaflet 初期化
  useEffect(() => {
    if (!mapData || !mapRef.current || leafletRef.current) return;

    // Leaflet CSS を動的注入
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    // Leaflet JS を動的ロード
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => initMap(mapData);
    document.body.appendChild(script);

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData]);

  function initMap(data: MapData) {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    // 地図初期化（タイルなし — GeoJSONのみ）
    const map = L.map(mapRef.current, {
      center:  [32.98, 131.72],
      zoom:    9,
      minZoom: 8,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false,
    });
    leafletRef.current = map;

    // 暗い背景タイル
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    // 市町村ごとのインシデント数でスタイルを決定
    const cityCounts = data.cityCounts;

    function getStyle(code: string) {
      const count = cityCounts[code] ?? 0;
      let fillColor = "rgba(0,212,255,0.04)";
      let color     = "rgba(0,212,255,0.25)";
      if (count >= 3) { fillColor = "rgba(255,82,82,0.15)"; color = "rgba(255,82,82,0.6)"; }
      else if (count >= 2) { fillColor = "rgba(255,215,64,0.10)"; color = "rgba(255,215,64,0.5)"; }
      else if (count >= 1) { fillColor = "rgba(0,212,255,0.08)"; color = "rgba(0,212,255,0.45)"; }
      return { fillColor, color, weight: 1, fillOpacity: 1, opacity: 1 };
    }

    // GeoJSON レイヤー
    fetch("/data/rotated.geojson")
      .then(r => r.json())
      .then(geojson => {
        // 市町村コードでフィーチャーをグループ化
        const cityLayerMap: Record<string, any> = {};

        L.geoJSON(geojson, {
          style: (feature: any) => {
            const code = feature.properties.N03_007 ?? "";
            return getStyle(code);
          },
          onEachFeature: (feature: any, layer: any) => {
            const code = feature.properties.N03_007 ?? "";
            const name = data.cityNames[code] ?? code;

            layer.on({
              mouseover: () => {
                layer.setStyle({ weight: 2, color: S.cyan, fillOpacity: 1 });
                setHoveredCity(code);
              },
              mouseout: () => {
                layer.setStyle(getStyle(code));
                setHoveredCity(null);
              },
              click: () => {
                router.push(`/map/${code}`);
              },
            });

            if (!cityLayerMap[code]) cityLayerMap[code] = [];
            cityLayerMap[code] = layer;
          },
        }).addTo(map);

        // 市町村マーカー（インシデント数バッジ）
        for (const [code, [lon, lat]] of Object.entries(data.centroids)) {
          const count = cityCounts[code] ?? 0;
          const name  = data.cityNames[code] ?? code;

          // カスタムアイコン（HTML）
          const badgeColor = count >= 3 ? S.red : count >= 2 ? S.yellow : count >= 1 ? S.cyan : S.text3;
          const badgeBg    = count >= 3 ? "rgba(255,82,82,0.18)" : count >= 2 ? "rgba(255,215,64,0.14)" : count >= 1 ? "rgba(0,212,255,0.12)" : "rgba(26,32,48,0.7)";

          const iconHtml = `
            <div style="
              display:flex;flex-direction:column;align-items:center;
              cursor:pointer;pointer-events:auto;
            ">
              <div style="
                background:${badgeBg};
                border:1px solid ${badgeColor};
                color:${badgeColor};
                font-family:'Share Tech Mono',monospace;
                font-size:10px;
                padding:2px 6px;
                white-space:nowrap;
                box-shadow:0 0 8px ${badgeColor}66;
                line-height:1.4;
              ">
                ${count > 0 ? `<span style="font-size:13px;font-weight:bold;">${count}</span> ` : ""}${name}
              </div>
              ${count > 0 ? `<div style="width:1px;height:6px;background:${badgeColor};opacity:0.6;"></div><div style="width:5px;height:5px;border-radius:50%;background:${badgeColor};box-shadow:0 0 6px ${badgeColor};"></div>` : ""}
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            className: "",
            iconAnchor: [0, 0],
          });

          L.marker([lat, lon], { icon })
            .addTo(map)
            .on("click", () => router.push(`/map/${code}`));
        }

        // インシデントマーカー（個別ピン）
        for (const inc of data.incidents) {
          const col = SEVERITY_COLOR[inc.severity] ?? S.cyan;
          const pinHtml = `
            <div style="
              width:10px;height:10px;border-radius:50%;
              background:${col};
              border:2px solid ${S.bg};
              box-shadow:0 0 10px ${col};
            "></div>
          `;
          const pinIcon = L.divIcon({ html: pinHtml, className: "", iconAnchor: [5, 5] });
          L.marker([inc.lat, inc.lon], { icon: pinIcon })
            .addTo(map)
            .bindTooltip(
              `<div style="font-family:'Share Tech Mono',monospace;font-size:11px;background:#0c1018;border:1px solid ${col};color:${col};padding:4px 8px;cursor:pointer;">${inc.name}<br/><span style="font-size:10px;opacity:0.7;">クリックで詳細</span></div>`,
              { className: "kaishoku-tooltip", direction: "top" }
            )
            .on("click", () => router.push(`/incidents/${inc.id}`));
        }
      });
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: S.bg, fontFamily: S.mono, color: S.cyan }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.15em", marginBottom: 8, color: S.text3 }}>LOADING DIMENSIONAL MAP...</div>
          <div style={{ width: 200, height: 2, background: S.border2, overflow: "hidden" }}>
            <div style={{ width: "60%", height: "100%", background: S.cyan, animation: "slide 1.2s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    );
  }

  const totalIncidents  = mapData?.incidents.length ?? 0;
  const criticalCount   = mapData?.incidents.filter(i => i.severity === "critical").length ?? 0;
  const affectedCities  = Object.keys(mapData?.cityCounts ?? {}).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: S.bg, fontFamily: S.mono }}>

      {/* ヘッダー */}
      <div style={{
        padding: "10px 14px",
        borderBottom: `1px solid ${S.border}`,
        background: S.panel,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
        flexWrap: "wrap",
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, color: S.text3, letterSpacing: "0.15em" }}>DIMENSIONAL OBSERVATION SYSTEM</div>
          <div style={{ fontSize: 14, color: S.cyan, letterSpacing: "0.06em" }}><Icon name="map" size={14} style={{ marginRight: 6 }} aria-hidden />海蝕インシデントマップ</div>
        </div>
        <div style={{ display: "flex", gap: 14, marginLeft: "auto", flexWrap: "wrap" }}>
          {[
            { label: "総インシデント", value: totalIncidents, color: S.cyan },
            { label: "重大案件",       value: criticalCount,  color: S.red },
            { label: "影響市町村",     value: affectedCities, color: S.yellow },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: "bold", color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10, color: S.text3, letterSpacing: "0.1em", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div style={{
        padding: "6px 14px",
        borderBottom: `1px solid ${S.border}`,
        background: S.panel,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexShrink: 0,
        flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 10, color: S.text3, letterSpacing: "0.12em" }}>SEVERITY:</div>
        {[
          { label: "CRITICAL", color: S.red },
          { label: "WARNING",  color: S.yellow },
          { label: "SAFE",     color: S.green },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}` }} />
            <span style={{ fontSize: 10, color: S.text2, letterSpacing: "0.1em" }}>{label}</span>
          </div>
        ))}
        <div style={{ fontSize: 10, color: S.text3, letterSpacing: "0.08em" }}>
          タップで詳細
        </div>
      </div>

      {/* 地図本体 */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {/* ホバー情報 */}
        {hoveredCity && mapData && (
          <div style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            background: S.panel,
            border: `1px solid ${S.border2}`,
            padding: "10px 14px",
            zIndex: 1000,
            pointerEvents: "none",
            boxShadow: `0 0 16px rgba(0,212,255,0.15)`,
          }}>
            <div style={{ fontSize: 12, color: S.cyan, marginBottom: 4 }}>
              {mapData.cityNames[hoveredCity]}
            </div>
            <div style={{ fontSize: 11, color: S.text2 }}>
              インシデント: {mapData.cityCounts[hoveredCity] ?? 0} 件
            </div>
            <div style={{ fontSize: 10, color: S.text3, marginTop: 4, letterSpacing: "0.1em" }}>
              CLICK TO VIEW DETAILS
            </div>
          </div>
        )}
      </div>

      <style>{`
        .kaishoku-tooltip .leaflet-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
        .leaflet-control-zoom { border: 1px solid ${S.border2} !important; }
        .leaflet-control-zoom a { background: ${S.panel} !important; color: ${S.cyan} !important; border-bottom: 1px solid ${S.border} !important; font-family: monospace; }
        .leaflet-control-zoom a:hover { background: ${S.panel2} !important; }
        @keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
      `}</style>
    </div>
  );
}
