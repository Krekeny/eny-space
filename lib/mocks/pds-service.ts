export function getMockPdsService() {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();

  const storageAllocatedBytes = 10 * 1024 ** 3; // 10 GiB
  const storageUsedBytes = Math.floor(2.8 * 1024 ** 3); // ~2.8 GiB
  const bandwidthLimitBytesPerMonth = 100 * 1024 ** 3; // 100 GiB
  const bandwidthUsedBytesThisMonth = Math.floor(14.7 * 1024 ** 3); // ~14.7 GiB
  const cpuUsagePercent = 23;
  const ramUsagePercent = 41;
  const userSlotsUsed = 1;
  const userSlotsTotal = 10;

  const storageUsedDailyLast30d = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (29 - i));
    const base = Math.floor(1.9 * 1024 ** 3);
    const growth = Math.floor(i * (34 * 1024 ** 2)); // ~34 MiB/day
    const noise = Math.floor(((i % 5) - 2) * (6 * 1024 ** 2));
    return { date: iso(d).slice(0, 10), usedBytes: base + growth + noise };
  });

  const requestsPerHourLast24h = Array.from({ length: 24 }).map((_, i) => {
    const d = new Date(now);
    d.setUTCHours(d.getUTCHours() - (23 - i), 0, 0, 0);
    const wave = 260 + Math.floor(180 * Math.sin((i / 24) * Math.PI * 2));
    const jitter = (i % 3) * 17;
    return { hour: iso(d), count: Math.max(40, wave + jitter) };
  });

  const failedRequestsLast24h = 42;
  const successfulRequestsLast24h = requestsPerHourLast24h.reduce(
    (sum, p) => sum + p.count,
    0,
  );

  return {
    id: 1,
    name: "test1-pds",
    service: "bluesky-pds",
    namespace: "kd0186-test1-pds",
    hostname: "test1.eny.space",
    encrypted_config: {
      hostname: "test1.eny.space",
      adminPassword: "zoidberg",
      emailSmtpUrl: "smtps://max@mustermann.de:s3cr3t@smtp.mustermann.de:465/",
      pdsEmailFromAddress: "test1@example.com",
      dataStorage: {
        size: "10Gi",
      },
    },
    install_cmd:
      "export KUBECONFIG={kubeconfig}\n" +
      "helm repo add nerkho https://charts.nerkho.ch\n" +
      "helm repo update\n" +
      "helm install bluesky-pds nerkho/bluesky-pds --namespace {namespace} -f {values}\n" +
      'export KUBECONFIG=""',
    state: 3,
    kubeconfig_id: 1,
    created_at: "2026-03-17T15:05:40.000000Z",
    updated_at: "2026-03-17T15:05:40.000000Z",
    stats: {
      cpuUsagePercent,
      ramUsagePercent,
      storageUsedBytes,
      storageAllocatedBytes,
      storageObjectsCount: 12345,
      storageUsedDailyLast30d,
      bandwidthUsedBytesThisMonth,
      bandwidthLimitBytesPerMonth,
      requestsLast24h: successfulRequestsLast24h,
      requestsPerHourLast24h,
      activeUsers: 3,
      uniqueUsersLast30d: 27,
      userSlotsUsed,
      userSlotsTotal,
      uptimeSeconds: 987654,
      lastBackupAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      failedRequestsLast24h,
      successfulRequestsLast24h,
    },
  };
}
