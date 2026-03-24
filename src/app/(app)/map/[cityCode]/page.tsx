import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityDetailClient } from "./CityDetailClient";
import { readFile } from "fs/promises";
import path from "path";

interface Props {
  params: Promise<{ cityCode: string }>;
}

// 地理データは静的ファイル、インシデントはDB
async function getMapData() {
  const p = path.join(process.cwd(), "public/data/area-incidents.json");
  const txt  = await readFile(p, "utf-8");
  const base = JSON.parse(txt);
  // インシデントはDBから取得（geojsonのcityNames/centroidsは静的のまま使用）
  const { getDb, queryAll } = await import("@/lib/db");
  const db   = getDb();
  const rows = await queryAll<{
    id: string; severity: string; status: string; name: string;
    city_code: string | null; city_name: string | null;
    lon: number; lat: number; gsi: number; division: string;
    desc: string; entity: string; time: string;
  }>(db, `SELECT id,severity,status,name,city_code,city_name,lon,lat,gsi,division,desc,entity,time FROM field_incidents`);
  base.incidents = rows.map(r => ({ ...r, cityCode: r.city_code, cityName: r.city_name }));
  return base;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cityCode } = await params;
  const data = await getMapData();
  const name = data.cityNames[cityCode];
  if (!name) return { title: "Not Found — 海蝕機関" };
  return { title: `${name} — 海蝕マップ — 海蝕機関` };
}

export default async function CityDetailPage({ params }: Props) {
  const { cityCode } = await params;
  const data = await getMapData();

  if (!data.cityNames[cityCode]) notFound();

  const cityName       = data.cityNames[cityCode] as string;
  const centroid       = data.centroids[cityCode] as [number, number];
  const cityIncidents  = (data.incidents as any[]).filter((i: any) => i.cityCode === cityCode);

  return (
    <CityDetailClient
      cityCode={cityCode}
      cityName={cityName}
      centroid={centroid}
      incidents={cityIncidents}
    />
  );
}
