"use client";

import { useEffect, useState } from "react";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { pdsStateLabel } from "@/lib/pds-state";

type ServiceStats = {
  cpuUsagePercent?: number;
  ramUsagePercent?: number;
  storageUsedBytes?: number;
  storageAllocatedBytes?: number;
  storageObjectsCount?: number;
  storageUsedDailyLast30d?: Array<{ date: string; usedBytes: number }>;
  bandwidthUsedBytesThisMonth?: number;
  bandwidthLimitBytesPerMonth?: number;
  requestsLast24h?: number;
  requestsPerHourLast24h?: Array<{ hour: string; count: number }>;
  activeUsers?: number;
  uniqueUsersLast30d?: number;
  userSlotsUsed?: number;
  userSlotsTotal?: number;
  uptimeSeconds?: number;
  lastBackupAt?: string;
  failedRequestsLast24h?: number;
  successfulRequestsLast24h?: number;
};

type ServiceConfig = {
  hostname: string;
  adminPassword?: string;
  emailSmtpUrl?: string;
  pdsEmailFromAddress?: string;
  dataStorage?: {
    size?: string;
  };
};

type ServiceResponse = {
  id?: number | string;
  name: string;
  service: string;
  namespace: string;
  state?: number | string;
  kubeconfig_id: number | string;
  encrypted_config: ServiceConfig;
  install_cmd: string;
  created_at?: string;
  updated_at?: string;
  stats?: ServiceStats;
};

function formatBytes(bytes?: number) {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return "—";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function ServiceDetailsClient({
  mode = "all",
}: {
  mode?: "all" | "stats" | "details";
}) {
  const [service, setService] = useState<ServiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch("/api/pds/service", {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data = (await res.json()) as ServiceResponse;
        console.log("[ServiceDetailsClient] response:", data);
        console.log("[ServiceDetailsClient] stats:", data.stats ?? "MISSING — stats section will not render");
        setService(data);
      } catch (err) {
        console.error("Failed to load service details", err);
        setError(
          err instanceof Error ? err.message : "Unknown error fetching service",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, []);

  if (loading) {
    return (
      <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-4 text-white/80 text-sm">
        Loading service details…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-md border border-rose-500/50 bg-rose-950/40 p-4 text-sm text-rose-100">
        Failed to load service details: {error}
      </div>
    );
  }

  if (!service) {
    return null;
  }

  const cfg = service.encrypted_config || {};
  const stats = service.stats;
  const maskedAdminPassword =
    cfg.adminPassword && cfg.adminPassword.length > 0 ? "••••••••" : undefined;

  const storagePct =
    stats?.storageUsedBytes !== undefined &&
    stats?.storageAllocatedBytes !== undefined &&
    stats.storageAllocatedBytes > 0
      ? clampPct((stats.storageUsedBytes / stats.storageAllocatedBytes) * 100)
      : undefined;

  const bandwidthPct =
    stats?.bandwidthUsedBytesThisMonth !== undefined &&
    stats?.bandwidthLimitBytesPerMonth !== undefined &&
    stats.bandwidthLimitBytesPerMonth > 0
      ? clampPct(
          (stats.bandwidthUsedBytesThisMonth /
            stats.bandwidthLimitBytesPerMonth) *
            100,
        )
      : undefined;

  const errorRatePct =
    stats?.failedRequestsLast24h !== undefined &&
    stats?.successfulRequestsLast24h !== undefined
      ? clampPct(
          (stats.failedRequestsLast24h /
            Math.max(
              1,
              stats.failedRequestsLast24h + stats.successfulRequestsLast24h,
            )) *
            100,
        )
      : undefined;

  const showDetails = mode === "all" || mode === "details";
  const showStats = mode === "all" || mode === "stats";

  return (
    <section
      className={
        mode === "stats"
          ? "space-y-3 text-white"
          : "mt-6 space-y-3 rounded-md border border-white/10 bg-white/5 p-4 text-white backdrop-blur-xl"
      }
    >
      {showDetails && (
        <>
          <Heading
            as="h2"
            className="text-sm font-semibold uppercase tracking-wide text-white/80"
          >
            Service Details
          </Heading>
          <div className="grid gap-3 md:grid-cols-2 text-sm text-white/80">
            {service.id !== undefined && (
              <div className="space-y-1">
                <Paragraph className="text-xs font-medium text-white/60">
                  ID
                </Paragraph>
                <Paragraph className="text-sm font-mono text-white">
                  {String(service.id)}
                </Paragraph>
              </div>
            )}
            <div className="space-y-1">
              <Paragraph className="text-xs font-medium text-white/60">
                Name
              </Paragraph>
              <Paragraph className="text-sm font-semibold text-white">
                {service.name}
              </Paragraph>
            </div>
            <div className="space-y-1">
              <Paragraph className="text-xs font-medium text-white/60">
                Service Type
              </Paragraph>
              <Paragraph className="text-sm font-semibold text-white">
                {service.service}
              </Paragraph>
            </div>
            <div className="space-y-1">
              <Paragraph className="text-xs font-medium text-white/60">
                Namespace
              </Paragraph>
              <Paragraph className="text-sm font-mono text-white">
                {service.namespace}
              </Paragraph>
            </div>
            {service.state !== undefined && (
              <div className="space-y-1">
                <Paragraph className="text-xs font-medium text-white/60">
                  State
                </Paragraph>
                <Paragraph className="text-sm font-mono text-white">
                  {pdsStateLabel(service.state)}
                </Paragraph>
              </div>
            )}
            {service.kubeconfig_id !== undefined && (
              <div className="space-y-1">
                <Paragraph className="text-xs font-medium text-white/60">
                  Kubeconfig ID
                </Paragraph>
                <Paragraph className="text-sm font-mono text-white">
                  {String(service.kubeconfig_id)}
                </Paragraph>
              </div>
            )}
            <div className="space-y-1">
              <Paragraph className="text-xs font-medium text-white/60">
                Hostname
              </Paragraph>
              <Paragraph className="text-sm font-semibold text-white">
                {cfg.hostname}
              </Paragraph>
            </div>
            {maskedAdminPassword && (
              <div className="space-y-1">
                <Paragraph className="text-xs font-medium text-white/60">
                  Admin Password
                </Paragraph>
                <Paragraph className="text-sm font-mono text-white">
                  {maskedAdminPassword}
                </Paragraph>
              </div>
            )}
            {cfg.pdsEmailFromAddress && (
              <div className="space-y-1">
                <Paragraph className="text-xs font-medium text-white/60">
                  PDS Email From
                </Paragraph>
                <Paragraph className="text-sm font-mono text-white">
                  {cfg.pdsEmailFromAddress}
                </Paragraph>
              </div>
            )}
            {cfg.emailSmtpUrl && (
              <div className="space-y-1 md:col-span-2">
                <Paragraph className="text-xs font-medium text-white/60">
                  SMTP URL
                </Paragraph>
                <Paragraph className="text-sm font-mono text-white break-all">
                  {cfg.emailSmtpUrl}
                </Paragraph>
              </div>
            )}
            {cfg.dataStorage?.size && (
              <div className="space-y-1">
                <Paragraph className="text-xs font-medium text-white/60">
                  Data Storage
                </Paragraph>
                <Paragraph className="text-sm font-semibold text-white">
                  {cfg.dataStorage.size}
                </Paragraph>
              </div>
            )}
            {(service.created_at || service.updated_at) && (
              <div className="space-y-1 md:col-span-2">
                <Paragraph className="text-xs font-medium text-white/60">
                  Timestamps
                </Paragraph>
                <Paragraph className="text-sm font-mono text-white/90">
                  {service.created_at && (
                    <span className="mr-4">
                      created_at: {service.created_at}
                    </span>
                  )}
                  {service.updated_at && (
                    <span>updated_at: {service.updated_at}</span>
                  )}
                </Paragraph>
              </div>
            )}
          </div>
        </>
      )}

      {showStats && stats && (
        <div className="mt-4 space-y-3">
          {mode !== "stats" && (
            <Paragraph className="text-xs font-medium text-white/60">
              Usage stats
            </Paragraph>
          )}

          <div className="grid gap-3 md:grid-cols-3 text-sm text-white/80">
            <div className="rounded border border-white/10 bg-white/5 p-3">
              <Paragraph className="text-xs font-medium text-white/60">
                CPU usage
              </Paragraph>
              <Paragraph className="text-sm font-semibold text-white">
                {stats.cpuUsagePercent !== undefined
                  ? `${clampPct(stats.cpuUsagePercent).toFixed(0)}%`
                  : "—"}
              </Paragraph>
              {stats.cpuUsagePercent !== undefined && (
                <div className="mt-2 h-2 w-full rounded bg-white/10">
                  <div
                    className="h-2 rounded bg-fuchsia-400/80"
                    style={{ width: `${clampPct(stats.cpuUsagePercent)}%` }}
                  />
                </div>
              )}
            </div>

            <div className="rounded border border-white/10 bg-white/5 p-3">
              <Paragraph className="text-xs font-medium text-white/60">
                RAM usage
              </Paragraph>
              <Paragraph className="text-sm font-semibold text-white">
                {stats.ramUsagePercent !== undefined
                  ? `${clampPct(stats.ramUsagePercent).toFixed(0)}%`
                  : "—"}
              </Paragraph>
              {stats.ramUsagePercent !== undefined && (
                <div className="mt-2 h-2 w-full rounded bg-white/10">
                  <div
                    className="h-2 rounded bg-amber-300/80"
                    style={{ width: `${clampPct(stats.ramUsagePercent)}%` }}
                  />
                </div>
              )}
              {stats.userSlotsUsed !== undefined &&
                stats.userSlotsTotal !== undefined && (
                  <Paragraph className="mt-2 text-xs text-white/70">
                    Users: {stats.userSlotsUsed}/{stats.userSlotsTotal}
                  </Paragraph>
                )}
            </div>

            <div className="rounded border border-white/10 bg-white/5 p-3">
              <Paragraph className="text-xs font-medium text-white/60">
                Storage
              </Paragraph>
              <Paragraph className="text-sm font-semibold text-white">
                {formatBytes(stats.storageUsedBytes)} /{" "}
                {formatBytes(stats.storageAllocatedBytes)}
              </Paragraph>
              {storagePct !== undefined && (
                <div className="mt-2 h-2 w-full rounded bg-white/10">
                  <div
                    className="h-2 rounded bg-emerald-400/80"
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
              )}
              {stats.storageObjectsCount !== undefined && (
                <Paragraph className="mt-2 text-xs text-white/70">
                  Objects: {stats.storageObjectsCount.toLocaleString()}
                </Paragraph>
              )}
            </div>

            <div className="rounded border border-white/10 bg-white/5 p-3">
              <Paragraph className="text-xs font-medium text-white/60">
                Bandwidth (month)
              </Paragraph>
              <Paragraph className="text-sm font-semibold text-white">
                {formatBytes(stats.bandwidthUsedBytesThisMonth)} /{" "}
                {formatBytes(stats.bandwidthLimitBytesPerMonth)}
              </Paragraph>
              {bandwidthPct !== undefined && (
                <div className="mt-2 h-2 w-full rounded bg-white/10">
                  <div
                    className="h-2 rounded bg-sky-400/80"
                    style={{ width: `${bandwidthPct}%` }}
                  />
                </div>
              )}
              {stats.requestsLast24h !== undefined && (
                <Paragraph className="mt-2 text-xs text-white/70">
                  Requests (24h): {stats.requestsLast24h.toLocaleString()}
                </Paragraph>
              )}
            </div>

            <div className="rounded border border-white/10 bg-white/5 p-3">
              <Paragraph className="text-xs font-medium text-white/60">
                Health (24h)
              </Paragraph>
              <Paragraph className="text-sm font-semibold text-white">
                Error rate:{" "}
                {errorRatePct !== undefined
                  ? `${errorRatePct.toFixed(2)}%`
                  : "—"}
              </Paragraph>
              {stats.lastBackupAt && (
                <Paragraph className="mt-2 text-xs text-white/70">
                  Last backup: {new Date(stats.lastBackupAt).toLocaleString()}
                </Paragraph>
              )}
              {stats.uptimeSeconds !== undefined && (
                <Paragraph className="mt-1 text-xs text-white/70">
                  Uptime: {(stats.uptimeSeconds / 3600).toFixed(1)}h
                </Paragraph>
              )}
            </div>
          </div>

          {Array.isArray(stats.requestsPerHourLast24h) &&
            stats.requestsPerHourLast24h.length > 0 && (
              <div className="rounded border border-white/10 bg-white/5 p-3">
                <Paragraph className="text-xs font-medium text-white/60">
                  Requests per hour (last 24h)
                </Paragraph>
                <div className="mt-3 flex h-16 items-end gap-1">
                  {(() => {
                    const max = Math.max(
                      ...stats.requestsPerHourLast24h!.map((p) => p.count),
                    );
                    return stats.requestsPerHourLast24h!.map((p, idx) => (
                      <div
                        key={`${p.hour}-${idx}`}
                        className="w-full rounded-sm bg-white/10"
                        title={`${new Date(p.hour).toLocaleString()}: ${p.count.toLocaleString()}`}
                        style={{
                          height: `${clampPct((p.count / Math.max(1, max)) * 100)}%`,
                          backgroundColor: "rgba(56, 189, 248, 0.6)",
                        }}
                      />
                    ));
                  })()}
                </div>
              </div>
            )}

          {Array.isArray(stats.storageUsedDailyLast30d) &&
            stats.storageUsedDailyLast30d.length > 0 && (
              <div className="rounded border border-white/10 bg-white/5 p-3">
                <Paragraph className="text-xs font-medium text-white/60">
                  Storage used (last 30d)
                </Paragraph>
                <div className="mt-3 flex h-16 items-end gap-1">
                  {(() => {
                    const max = Math.max(
                      ...stats.storageUsedDailyLast30d!.map((p) => p.usedBytes),
                    );
                    return stats.storageUsedDailyLast30d!.map((p, idx) => (
                      <div
                        key={`${p.date}-${idx}`}
                        className="w-full rounded-sm bg-emerald-400/50"
                        title={`${p.date}: ${formatBytes(p.usedBytes)}`}
                        style={{
                          height: `${clampPct((p.usedBytes / Math.max(1, max)) * 100)}%`,
                        }}
                      />
                    ));
                  })()}
                </div>
              </div>
            )}
        </div>
      )}

      {showDetails && service.install_cmd && (
        <div className="mt-3 space-y-1">
          <Paragraph className="text-xs font-medium text-white/60">
            Install command
          </Paragraph>
          <pre className="max-h-64 overflow-auto rounded bg-neutral-900/90 p-3 text-xs text-neutral-100">
            {service.install_cmd}
          </pre>
        </div>
      )}
    </section>
  );
}
