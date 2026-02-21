import React, { useEffect } from "react";
import { LayoutDashboard, Search as SearchIcon, Settings as SettingsIcon } from "lucide-react";

import TabBar from "@/components/TabBar/TabBar";
import Sidebar from "@/components/Sidebar/Sidebar";

import Dashboard from "@/pages/Dashboard";
import Deck from "@/pages/Deck";
import Settings from "@/pages/Settings";

import { useAppStore } from "@/store/useAppStore";
import { applyTheme } from "@/utils/applyTheme";
import Search from "@/pages/Search";
import EditorPage from "@/pages/EditorPage";

const MOBILE_NAV = [
    { view: "decks" as const, icon: <LayoutDashboard className="w-5 h-5" />, label: "Home" },
    { view: "search" as const, icon: <SearchIcon className="w-5 h-5" />, label: "Search" },
    { view: "settings" as const, icon: <SettingsIcon className="w-5 h-5" />, label: "Settings" },
];

const App = () => {
    const {
        activeTabId,
        navView,
        themePreset,
        fontSize,
        uiFont,
        displayFont,
        loadDecksFromDB,
        setNavView,
        closeTab,
        tabs,
    } = useAppStore();

    useEffect(() => {
        loadDecksFromDB();
        applyTheme({ themePreset, fontSize, uiFont, displayFont });
    }, []);

    const renderMain = () => {
        if (navView === "editor") return <EditorPage />;
        if (activeTabId !== null) return <Deck />;
        if (navView === "search") return <Search />;
        if (navView === "settings") return <Settings />;
        return <Dashboard />;
    };

    return (
        <div className="w-screen h-screen overflow-hidden flex flex-col bg-background">
            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Sidebar: hidden on mobile, visible on md+ */}
                <div className="hidden md:flex h-full">
                    <Sidebar />
                </div>
                <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                    <TabBar />
                    <main className="flex-1 overflow-y-auto">
                        {renderMain()}
                    </main>
                </div>
            </div>

            {/* Mobile bottom navigation — visible only below md */}
            <nav className="md:hidden shrink-0 flex items-stretch border-t border-secondary/30 bg-primary">
                {MOBILE_NAV.map(({ view, icon, label }) => {
                    const isActive =
                        navView === view && !activeTabId;
                    return (
                        <button
                            key={view}
                            onClick={() => {
                                // Close any open tabs when going to search/settings
                                if (view !== "decks" && activeTabId) {
                                    tabs.forEach((t) => closeTab(t.tabId));
                                }
                                setNavView(view);
                            }}
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
                            style={{
                                color: isActive
                                    ? "var(--color-paper)"
                                    : "rgba(255,253,247,0.45)",
                                borderTop: isActive
                                    ? "2px solid var(--color-secondary)"
                                    : "2px solid transparent",
                            }}>
                            {icon}
                            <span className="font-ui text-[10px] leading-none">{label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default App;
