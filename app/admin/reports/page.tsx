export default function AdminReports() {
  return (
    <main>
      <h1>Reports</h1>
      <p>Quick exports:</p>
      <ul>
        <li><a href="/api/admin/reports?type=completions">Completions (CSV)</a></li>
        <li><a href="/api/admin/reports?type=attempts">All Attempts (CSV)</a></li>
      </ul>
    </main>
  );
}

