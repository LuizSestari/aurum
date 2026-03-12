"use client";

import { useCallback, useState } from "react";
import type { OrbState } from "@/lib/aurum-voice";
import { stopSpeak } from "@/lib/aurum-voice";
import Sidebar, { type PageId } from "./Sidebar";
import ChatPage from "./pages/ChatPage";
import VisionPage from "./pages/VisionPage";
import TasksPage from "./pages/TasksPage";
import HabitsPage from "./pages/HabitsPage";
import ProjectsPage from "./pages/ProjectsPage";
import RemindersPage from "./pages/RemindersPage";
import FinancePage from "./pages/FinancePage";
import KnowledgePage from "./pages/KnowledgePage";
import UpdatesPage from "./pages/UpdatesPage";
import DashboardPage from "./pages/DashboardPage";
import DeveloperPage from "./pages/DeveloperPage";
import VoicePage from "./pages/VoicePage";
import { NewsPage } from "./pages/NewsPage";
import SettingsPage from "./pages/SettingsPage";
import { GlobalSearch } from "./GlobalSearch";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { PomodoroTimer } from "./PomodoroTimer";
import { PWAInstall } from "./PWAInstall";

interface Props {
  userName?: string;
  onSignOut?: () => void;
  onNavigatePricing?: () => void;
  currentPlan?: string;
}

export default function AurumShell({ userName, onSignOut, onNavigatePricing, currentPlan }: Props) {
  const [activePage, setActivePage] = useState<PageId>("chat");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [muted, setMuted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleMuteToggle = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (next) {
        stopSpeak();
        setOrbState("muted");
      } else {
        setOrbState("idle");
      }
      return next;
    });
  }, []);

  const handleOrbState = useCallback((s: OrbState) => {
    setOrbState(s);
  }, []);

  function renderPage() {
    switch (activePage) {
      case "chat":
        return (
          <ChatPage muted={muted} onMuteToggle={handleMuteToggle} orbState={orbState} onOrbState={handleOrbState} userName={userName} />
        );
      case "vision":
        return <VisionPage />;
      case "tasks":
        return <TasksPage />;
      case "habits":
        return <HabitsPage />;
      case "projects":
        return <ProjectsPage />;
      case "reminders":
        return <RemindersPage />;
      case "finance":
        return <FinancePage />;
      case "knowledge":
        return <KnowledgePage />;
      case "updates":
        return <UpdatesPage />;
      case "dashboard":
        return <DashboardPage orbState={orbState} userName={userName} />;
      case "voice":
        return <VoicePage />;
      case "news":
        return <NewsPage />;
      case "developer":
        return <DeveloperPage />;
      case "settings":
        return <SettingsPage userName={userName} currentPlan={currentPlan} onNavigatePricing={onNavigatePricing} />;
      default:
        return (
          <ChatPage muted={muted} onMuteToggle={handleMuteToggle} orbState={orbState} onOrbState={handleOrbState} userName={userName} />
        );
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#070A0F] text-white">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onSignOut={onSignOut} onNavigatePricing={onNavigatePricing} />
      <main className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute -top-40 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
          <div className="absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
        </div>
        <div className="relative flex-1 min-h-0 z-10">{renderPage()}</div>
      </main>

      {/* Global overlays */}
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} onNavigate={(page) => setActivePage(page as PageId)} />
      <KeyboardShortcuts onSearch={() => setShowSearch(true)} onNavigate={(page) => setActivePage(page as PageId)} />
      <PomodoroTimer />
      <PWAInstall />
    </div>
  );
}
