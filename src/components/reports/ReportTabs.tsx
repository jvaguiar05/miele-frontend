import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const tabs = [
  ["Personalizado", "/reports/status"], ["Selic acumulada", "/reports/selic"],
  ["Próximos a vencer", "/reports"], ["Fechamento trimestral", "/reports/quarters"],
  ["Atualizações diárias", "/reports/updates"],
] as const;

export default function ReportTabs() {
  const { pathname } = useLocation();
  return <nav className="flex gap-2 overflow-x-auto pb-1 no-print" aria-label="Relatórios">
    {tabs.map(([label, href]) => <Button key={href} asChild size="sm" variant={pathname === href ? "default" : "outline"}><Link to={href}>{label}</Link></Button>)}
  </nav>;
}
