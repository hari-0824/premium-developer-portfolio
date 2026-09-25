import { useEffect, useState } from "react";
import { BrowserRouter, HashRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import {
  goToOwnHash,
  isAdminHash,
  mirrorToParent,
  parentWindow,
  type Entry,
} from "@/lib/entry";
import { AuthProvider } from "@/contexts/AuthContext";
import { PortfolioProvider, usePortfolio } from "@/contexts/PortfolioProvider";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";

/* ── Public site (existing) ── */
import Backdrop, { CursorGlow } from "@/components/Backdrop";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { Stats, About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Projects } from "@/components/Projects";
import { GitHubRepos } from "@/components/GitHubRepos";
import { Achievements, Journey } from "@/components/Timeline";
import { Dashboard } from "@/components/Dashboard";
import { Resume } from "@/components/Resume";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

/* ── Admin pages ── */
import Login from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import ProfileEditor from "@/pages/admin/ProfileEditor";
import AboutEditor from "@/pages/admin/AboutEditor";
import SkillsManager from "@/pages/admin/SkillsManager";
import ProjectsManager from "@/pages/admin/ProjectsManager";
import AchievementsManager from "@/pages/admin/AchievementsManager";
import JourneyManager from "@/pages/admin/JourneyManager";
import ResumeManager from "@/pages/admin/ResumeManager";
import Settings from "@/pages/admin/Settings";

function PublicSite() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <Backdrop />
      <CursorGlow />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <About />
        <Skills />
        <Projects />
        <GitHubRepos />
        <Achievements />
        <Journey />
        <Dashboard />
        <Resume />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * ADMIN tree — HashRouter, admin routes ONLY.
 * The public homepage is not in this route table, so it can never render
 * while the admin entry point is active. Unknown #/admin/... paths go to the
 * protected dashboard (which itself sends anonymous users to login).
 * ──────────────────────────────────────────────────────────────────────── */
/** Admin route elements, shared by both trees (called as a function so the
 *  <Route> elements sit directly inside each <Routes>). */
function adminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="profile" element={<ProfileEditor />} />
        <Route path="about" element={<AboutEditor />} />
        <Route path="skills" element={<SkillsManager />} />
        <Route path="projects" element={<ProjectsManager />} />
        <Route path="achievements" element={<AchievementsManager />} />
        <Route path="journey" element={<JourneyManager />} />
        <Route path="resume" element={<ResumeManager />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </>
  );
}

/** Keeps the wrapper page's address bar equal to the current admin route
 *  (renders nothing). Needed when the app runs inside Arena's iframe. */
function MirrorAdminRoute() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    mirrorToParent("#" + pathname + search);
  }, [pathname, search]);
  return null;
}

function AdminApp() {
  return (
    <HashRouter>
      <MirrorAdminRoute />
      <Routes>
        {adminRoutes()}
        {/* anything else inside the admin entry → dashboard (never the homepage) */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </HashRouter>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * PUBLIC tree — BrowserRouter, unchanged public site.
 * Clean /admin/* URLs still work here on hosts with an SPA rewrite
 * (Vite dev server, Netlify _redirects, Vercel rewrites).
 * ──────────────────────────────────────────────────────────────────────── */
/** Subscribes to the portfolio data so the whole public tree re-renders
 *  (no remount) when Supabase content arrives — e.g. profiles.full_name in
 *  the navbar and Hero heading. Renders exactly the same routes as before. */
function PublicRoutes() {
  usePortfolio();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        {adminRoutes()}
        <Route path="*" element={<PublicSite />} />
      </Routes>
    </BrowserRouter>
  );
}

function PublicApp() {
  return (
    <PortfolioProvider>
      <PublicRoutes />
    </PortfolioProvider>
  );
}

/**
 * Entry selection.
 *
 * `initialEntry` is computed in main.tsx BEFORE React renders (from the
 * inline <head> script in index.html), so on a fresh load of /#/admin/login
 * the HashRouter admin tree is the first and only thing rendered.
 * Later hash changes on a live page (e.g. homepage → #/admin/login) switch
 * trees through the hashchange listener.
 */
export default function App({ initialEntry }: { initialEntry: Entry }) {
  const [entry, setEntry] = useState<Entry>(initialEntry);

  useEffect(() => {
    /* 1) This window's own hash (HashRouter navigation, public #anchors). */
    const onOwnHash = () => setEntry(isAdminHash() ? "admin" : "public");
    window.addEventListener("hashchange", onOwnHash);

    /* 2) The wrapper page's hash (Arena iframe). A visitor on "/" who types
          "#/admin/login" changes only the OUTER page — this iframe is never
          reloaded — so the outer hash must drive the admin entry. */
    const parent = parentWindow();
    const onParentHash = () => {
      if (!parent) return;
      if (isAdminHash(parent.location.hash)) {
        goToOwnHash("#" + parent.location.hash.replace(/^#!?\/?/, "/")); // HashRouter follows
        setEntry("admin");
      } else if (isAdminHash()) {
        /* address bar left /admin → drop the iframe's admin hash, show public */
        history.replaceState(history.state, "", location.pathname + location.search);
        setEntry("public");
      }
    };
    parent?.addEventListener("hashchange", onParentHash);

    return () => {
      window.removeEventListener("hashchange", onOwnHash);
      parent?.removeEventListener("hashchange", onParentHash);
    };
  }, []);

  useEffect(() => {
    console.info(
      `[entry] ${entry === "admin" ? "admin → HashRouter" : "public → BrowserRouter"}`,
    );
  }, [entry]);

  return (
    <AuthProvider>{entry === "admin" ? <AdminApp /> : <PublicApp />}</AuthProvider>
  );
}
