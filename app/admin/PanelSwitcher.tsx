"use client";
import dynamic from "next/dynamic";

// Client-wrapped panels. Pages already marked as client can be imported directly.
const UsersPanel = dynamic(() => import("./users/page"), { ssr: false });
const ModulesPanel = dynamic(() => import("./modules/page"), { ssr: false });
const QuizzesPanel = dynamic(() => import("./quizzes/page"), { ssr: false });
const QuestionsPanel = dynamic(() => import("./questions/page"), { ssr: false });
const CertificatesPanel = dynamic(() => import("./certificates/page"), { ssr: false });
const SettingsPanelDyn = dynamic(() => import("./settings/page"), { ssr: false });

// Lightweight client equivalents for simple server pages
function ReportsPanel() {
  return (
    <section>
      <h1>Reports</h1>
      <p>Quick exports:</p>
      <ul>
        <li><a href="/api/admin/reports?type=completions">Completions (CSV)</a></li>
        <li><a href="/api/admin/reports?type=attempts">All Attempts (CSV)</a></li>
      </ul>
    </section>
  );
}

// Settings panel is a client page with MFA controls

const ProfilePanel = dynamic(() => import("../profile/profile-form"), { ssr: false });

export default function PanelSwitcher({ view }: { view: string }) {
  switch (view) {
    case "users":
      return <UsersPanel />;
    case "modules":
      return <ModulesPanel />;
    case "quizzes":
      return <QuizzesPanel />;
    case "questions":
      return <QuestionsPanel />;
    case "reports":
      return <ReportsPanel />;
    case "certificates":
      return <CertificatesPanel />;
    case "settings":
      return <SettingsPanelDyn />;
    case "profile":
      return (
        <section>
          <h1>Profile</h1>
          <ProfilePanel />
        </section>
      );
    default:
      return null;
  }
}
