import type { Metadata } from "next";
import { MapClient } from "./MapClient";

export const metadata: Metadata = { title: "海蝕マップ — 海蝕機関" };

export default function MapPage() {
  return <MapClient />;
}
