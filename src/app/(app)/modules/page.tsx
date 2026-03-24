import { redirect } from "next/navigation";
export default function ModulesPage() {
  redirect("/database?tab=modules");
}
