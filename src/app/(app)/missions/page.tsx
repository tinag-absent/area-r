import { redirect } from "next/navigation";
export default function MissionsPage() {
  redirect("/database?tab=missions");
}
