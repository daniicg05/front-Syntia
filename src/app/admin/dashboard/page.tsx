"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Users, FolderOpen, Star, FileText } from "lucide-react";

interface Stats {
  totalUsuarios: number;
  totalProyectos: number;
  totalRecomendaciones: number;
  totalConvocatorias: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then((res) => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cards = [
    { label: "Usuarios", value: stats?.totalUsuarios, icon: Users, bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Proyectos", value: stats?.totalProyectos, icon: FolderOpen, bg: "bg-primary-light", text: "text-primary" },
    { label: "Recomendaciones", value: stats?.totalRecomendaciones, icon: Star, bg: "bg-amber-50", text: "text-amber-600" },
    { label: "Convocatorias", value: stats?.totalConvocatorias, icon: FileText, bg: "bg-surface-muted", text: "text-foreground-muted" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Panel de administración</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, bg, text }) => (
          <Card key={label}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${text}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
                <p className="text-sm text-foreground-muted">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
