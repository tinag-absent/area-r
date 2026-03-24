import { redirect } from "next/navigation";
export default function PersonnelPage() {
  redirect("/database?tab=personnel");
}
