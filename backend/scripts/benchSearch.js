// Measures search speed with and without the Redis cache. The backend must be running.
//   npm run bench           (200 requests per mode)
//   npm run bench -- 500
const API = process.env.API || 'http://localhost:5000/api';
const N = parseInt(process.argv[2]) || 200;
const QUERIES = ['phone', 'laptop', 'shirt', 'cream', 'watch', 'bag', 'shoes', 'oil'];

async function run(label, extra) {
  const times = [];
  for (let i = 0; i < N; i++) {
    const url = `${API}/search?q=${QUERIES[i % QUERIES.length]}&sort=price_asc&limit=12${extra}`;
    const t = performance.now();
    const r = await fetch(url);
    await r.json();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p = (x) => times[Math.floor(times.length * x)];
  return { label, avg, p50: p(0.5), p95: p(0.95) };
}

(async () => {
  const health = await fetch(`${API}/search?q=phone&limit=1`).then((r) => r.json());
  console.log(`Catalogue size matching "phone": ${health.total}. Running ${N} requests per mode...\n`);
  const rows = [await run('Elasticsearch only (no cache)', '&nocache=1'), await run('With Redis cache', '')];
  console.log('| Mode | Avg (ms) | p50 (ms) | p95 (ms) |\n|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.label} | ${r.avg.toFixed(1)} | ${r.p50.toFixed(1)} | ${r.p95.toFixed(1)} |`);
})().catch((e) => {
  console.error('Benchmark failed. Is the backend running?', e.message);
  process.exit(1);
});
