/**
 * GET /api/incidents — フィールドインシデント一覧（DB版）
 * MapClient が期待する MapData 形式 { incidents, cityCounts, centroids, cityNames } で返す
 * Updated: 2026-03-23 — createRoute に移行
 * Fixed:   2026-03-23 — MapClient の MapData 形式に合わせてレスポンス構造を修正
 */
import { NextResponse }           from "next/server";
import { createRoute }            from "@/lib/api/handler";
import { queryAll }               from "@/lib/db";
import type { DbFieldIncident }   from "@/types/db";

export const GET = createRoute({
  auth: "player",
  handler: async ({ db }) => {
    const rows = await queryAll<Pick<
      DbFieldIncident,
      "id" | "severity" | "status" | "name" | "lon" | "lat" |
      "location" | "entity" | "gsi" | "division" | "desc" | "time" | "city_code" | "city_name"
    >>(db,
      `SELECT id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name
       FROM field_incidents ORDER BY time DESC`
    );

    // MapClient の Incident 型に合わせてフィールド名を変換
    const incidents = rows.map(r => ({
      id:       r.id,
      severity: r.severity,
      status:   r.status,
      name:     r.name,
      lon:      Number(r.lon),
      lat:      Number(r.lat),
      location: r.location,
      entity:   r.entity,
      gsi:      Number(r.gsi),
      division: r.division,
      desc:     r.desc,
      time:     r.time,
      cityCode: r.city_code ?? "",
      cityName: r.city_name ?? "",
    }));

    // MapClient が必要とする集計データを JS 側で計算
    // cityCounts: 市町村コード → インシデント件数
    const cityCounts: Record<string, number> = {};
    // cityNames: 市町村コード → 市町村名
    const cityNames: Record<string, string> = {};
    // centroids: 市町村コード → [lon, lat] の重心（インシデント座標の平均）
    const centroidAccum: Record<string, { sumLon: number; sumLat: number; count: number }> = {};

    for (const inc of incidents) {
      const code = inc.cityCode;
      if (!code) continue;

      cityCounts[code] = (cityCounts[code] ?? 0) + 1;

      if (inc.cityName) cityNames[code] = inc.cityName;

      if (!centroidAccum[code]) centroidAccum[code] = { sumLon: 0, sumLat: 0, count: 0 };
      centroidAccum[code].sumLon += inc.lon;
      centroidAccum[code].sumLat += inc.lat;
      centroidAccum[code].count  += 1;
    }

    const centroids: Record<string, [number, number]> = {};
    for (const [code, { sumLon, sumLat, count }] of Object.entries(centroidAccum)) {
      centroids[code] = [sumLon / count, sumLat / count];
    }

    // MapData 形式で返す（この構造が MapClient の setMapData に渡される）
    return NextResponse.json({ incidents, cityCounts, centroids, cityNames });
  },
});
