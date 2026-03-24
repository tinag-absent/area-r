"use client";

import { useEffect, useRef } from "react";
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

const SEVERITY_LABEL: Record<string, string> = {
  critical: "重大",
  warning:  "警戒",
  safe:     "観察",
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

interface Props {
  cityCode:  string;
  cityName:  string;
  centroid:  [number, number];  // [lon, lat]
  incidents: Incident[];
}

export function CityDetailClient({ cityCode, cityName, centroid, incidents }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const router     = useRouter();

  const criticalCount = incidents.filter(i => i.severity === "critical").length;
  const warningCount  = incidents.filter(i => i.severity === "warning").length;
  const safeCount     = incidents.filter(i => i.severity === "safe").length;

  // 最高脅威レベル
  const maxSeverity = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : safeCount > 0 ? "safe" : null;
  const headerColor = maxSeverity ? SEVERITY_COLOR[maxSeverity] : S.cyan;

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => initMap();
    document.body.appendChild(script);

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initMap() {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const [lon, lat] = centroid;

    const map = L.map(mapRef.current, {
      center:          [lat, lon],
      zoom:            11,
      minZoom:         9,
      maxZoom:         14,
      zoomControl:     true,
      attributionControl: false,
    });
    leafletRef.current = map;

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    // GeoJSON — 対象市町村だけハイライト
    fetch("/data/rotated.geojson")
      .then(r => r.json())
      .then(geojson => {
        L.geoJSON(geojson, {
          filter: (feature: any) => feature.properties.N03_007 === cityCode,
          style: () => ({
            fillColor: `${headerColor}22`,
            color:     headerColor,
            weight:    1.5,
            fillOpacity: 1,
            opacity:   0.8,
          }),
        }).addTo(map);

        // 周辺市町村（薄く）
        L.geoJSON(geojson, {
          filter: (feature: any) => feature.properties.N03_007 !== cityCode,
          style: () => ({
            fillColor: "rgba(0,212,255,0.02)",
            color:     "rgba(0,212,255,0.12)",
            weight:    0.5,
            fillOpacity: 1,
            opacity:   0.5,
          }),
        }).addTo(map);
      });

    // 市町村の中心マーカー
    const cityIcon = (window as any).L.divIcon({
      html: `<div style="
        background:rgba(0,0,0,0.7);
        border:1px solid ${headerColor};
        color:${headerColor};
        font-family:'Share Tech Mono',monospace;
        font-size:11px;
        padding:3px 8px;
        white-space:nowrap;
        box-shadow:0 0 10px ${headerColor}88;
      ">${cityName}</div>`,
      className: "",
      iconAnchor: [0, 0],
    });
    L.marker([lat, lon], { icon: cityIcon }).addTo(map);

    // インシデントマーカー
    for (const inc of incidents) {
      const col = SEVERITY_COLOR[inc.severity] ?? S.cyan;

      const incIcon = L.divIcon({
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="
              background:rgba(7,9,15,0.85);
              border:1px solid ${col};
              color:${col};
              font-family:'Share Tech Mono',monospace;
              font-size:9px;
              padding:2px 6px;
              white-space:nowrap;
              box-shadow:0 0 8px ${col}66;
              max-width:160px;
              overflow:hidden;
              text-overflow:ellipsis;
            ">${inc.name}</div>
            <div style="width:1px;height:8px;background:${col};opacity:0.7;"></div>
            <div style="
              width:12px;height:12px;border-radius:50%;
              background:${col};
              border:2px solid #07090f;
              box-shadow:0 0 10px ${col};
            "></div>
          </div>
        `,
        className: "",
        iconAnchor: [0, 28],
      });

      L.marker([inc.lat, inc.lon], { icon: incIcon })
        .addTo(map)
        .bindPopup(`
          <div style="
            font-family:'Share Tech Mono',monospace;
            background:#0c1018;
            border:1px solid ${col};
            color:#cdd6e8;
            padding:10px 14px;
            min-width:220px;
          ">
            <div style="color:${col};font-size:12px;margin-bottom:6px;">${inc.name}</div>
            <div style="font-size:10px;color:#7a8aa0;margin-bottom:4px;">${inc.location}</div>
            <div style="font-size:11px;line-height:1.5;">${inc.desc}</div>
            <div style="margin-top:8px;font-size:10px;color:#7a8aa0;">
              GSI: ${inc.gsi} | ${inc.division}
            </div>
            <div style="font-size:10px;color:#445060;margin-top:2px;">${inc.time}</div>
          </div>
        `, { className: "kaishoku-popup", maxWidth: 300 });
    }
  }

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
        <button
          onClick={() => router.push("/map")}
          style={{
            background: "transparent",
            border: `1px solid ${S.border2}`,
            color: S.text2,
            cursor: "pointer",
            fontFamily: S.mono,
            fontSize: 11,
            padding: "4px 10px",
            letterSpacing: "0.1em",
          }}
        >
          ← BACK
        </button>
        <div>
          <div style={{ fontSize: 10, color: S.text3, letterSpacing: "0.15em" }}>AREA DETAIL / {cityCode}</div>
          <div style={{ fontSize: 16, color: headerColor, letterSpacing: "0.06em" }}><Icon name="map" size={14} style={{ marginRight: 6 }} aria-hidden />{cityName}</div>
        </div>
        {maxSeverity && (
          <div style={{
            marginLeft: "auto",
            background: `${headerColor}18`,
            border: `1px solid ${headerColor}`,
            color: headerColor,
            fontSize: 10,
            padding: "3px 10px",
            letterSpacing: "0.15em",
            boxShadow: `0 0 10px ${headerColor}44`,
          }}>
            {SEVERITY_LABEL[maxSeverity]} / {incidents.length} 件
          </div>
        )}
      </div>

      <div className="layout-split" style={{ flex: 1, overflow: "hidden" }}>

        {/* 左パネル: インシデント一覧 */}
        <div className="layout-split-sidebar" style={{
          width: 300,
          flexShrink: 0,
          borderRight: `1px solid ${S.border}`,
          overflowY: "auto",
          background: S.panel,
        }}>
          {/* サマリ */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${S.border}` }}>
            <div style={{ fontSize: 10, color: S.text3, letterSpacing: "0.12em", marginBottom: 10 }}>INCIDENT SUMMARY</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "重大", count: criticalCount, color: S.red },
                { label: "警戒", count: warningCount,  color: S.yellow },
                { label: "観察", count: safeCount,     color: S.green },
              ].map(({ label, count, color }) => (
                <div key={label} style={{
                  flex: 1,
                  background: `${color}0f`,
                  border: `1px solid ${color}44`,
                  padding: "8px 0",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 20, fontWeight: "bold", color, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 10, color: S.text3, marginTop: 3, letterSpacing: "0.1em" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* インシデントリスト */}
          <div style={{ padding: "8px 0" }}>
            {incidents.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: S.text3, fontSize: 12 }}>
                インシデントなし
              </div>
            ) : (
              incidents.map((inc) => {
                const col = SEVERITY_COLOR[inc.severity] ?? S.cyan;
                return (
                  <div
                    key={inc.id}
                    onClick={() => router.push(`/incidents/${inc.id}`)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: `1px solid ${S.border}`,
                      borderLeft: `3px solid ${col}`,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${col}08`)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{
                        background: `${col}18`,
                        border: `1px solid ${col}66`,
                        color: col,
                        fontSize: 10,
                        padding: "1px 6px",
                        letterSpacing: "0.1em",
                      }}>
                        {SEVERITY_LABEL[inc.severity] ?? inc.severity}
                      </div>
                      <div style={{
                        background: `${S.text3}18`,
                        border: `1px solid ${S.border2}`,
                        color: S.text3,
                        fontSize: 10,
                        padding: "1px 6px",
                        letterSpacing: "0.1em",
                      }}>
                        {inc.status}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: S.text, marginBottom: 4, lineHeight: 1.4 }}>{inc.name}</div>
                    <div style={{ fontSize: 11, color: S.text2, marginBottom: 6, lineHeight: 1.5 }}>{inc.desc}</div>
                    <div style={{ fontSize: 10, color: S.text3, display: "flex", gap: 12 }}>
                      <span>GSI {inc.gsi}</span>
                      <span>{inc.entity}</span>
                    </div>
                    <div style={{ fontSize: 10, color: S.text3, marginTop: 2 }}>
                      {inc.division} — {inc.time}
                    </div>
                    <div style={{ fontSize: 10, color: S.text3, marginTop: 4, letterSpacing: "0.08em" }}>
                      座標: {inc.lat.toFixed(4)}°N, {inc.lon.toFixed(4)}°E
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 右: 地図 */}
        <div className="layout-split-main" style={{ flex: 1, position: "relative" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </div>
      </div>

      <style>{`
        .kaishoku-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .kaishoku-popup .leaflet-popup-content { margin: 0 !important; }
        .kaishoku-popup .leaflet-popup-tip-container { display: none; }
        .leaflet-control-zoom { border: 1px solid ${S.border2} !important; }
        .leaflet-control-zoom a { background: ${S.panel} !important; color: ${S.cyan} !important; border-bottom: 1px solid ${S.border} !important; font-family: monospace; }
        .leaflet-control-zoom a:hover { background: ${S.panel2} !important; }
      `}</style>
    </div>
  );
}
