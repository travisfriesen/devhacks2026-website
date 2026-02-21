import React, { useRef } from "react";
import {
    TrendingUp,
    Calendar,
    Flame,
    PlayCircle,
    Star,
    Pencil,
    Plus,
    FolderOpen,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import InspirationalQuotes from "@/components/InspirationalQuotes/InspirationalQuotes";
import { heatColor } from "@/utils/misc";
import { parseYamlString } from "@/yamlparse";

const Dashboard = () => {
    const {
        decks,
        openTab,
        pinnedDeckIds,
        togglePinDeck,
        openEditor,
        createDeck,
        importDeck,
    } = useAppStore();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const content = await file.text();
        const deck = parseYamlString(content, file.name);
        if (deck) {
            importDeck(deck);
            openEditor(deck.deckId);
        }
        // Reset file input so the same file can be selected again
        e.target.value = "";
    };

    const allCards = decks.flatMap((deck) =>
        deck.cards.map((card) => ({ ...card, deckName: deck.deckName })),
    );

    const totalStreak = decks.reduce(
        (sum, deck) => Math.max(sum, deck.streak),
        0,
    );

    const lastDeck =
        decks.length > 0
            ? [...decks].sort(
                (a, b) =>
                    new Date(b.lastUtilized).getTime() -
                    new Date(a.lastUtilized).getTime(),
            )[0]
            : null;

    const totalCards = allCards.length;
    const pinnedDecks = decks.filter((d) => pinnedDeckIds.includes(d.deckId));

    // Mocked heatmap — deterministic realistic-looking activity over last 26 weeks
    const heatmap = Array.from({ length: 26 }, (_, wi) =>
        Array.from({ length: 7 }, (_, di) => {
            const seed = (wi * 7 + di + 3) * 9301 + 49297;
            const rng = ((seed * 233280 + 1) % 1e9) / 1e9;
            if (wi < 4) return 0;
            if (rng < 0.28) return 0;
            if (rng < 0.55) return rng * 0.3;
            if (rng < 0.75) return 0.3 + rng * 0.4;
            if (rng < 0.90) return 0.6 + rng * 0.2;
            return 0.85 + rng * 0.15;
        }),
    );

    // Mocked weekly review counts for the summary panel
    const MOCK_WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const MOCK_WEEK_COUNTS = [42, 67, 31, 88, 55, 20, 74];
    const mockTotalThisWeek = MOCK_WEEK_COUNTS.reduce((a, b) => a + b, 0);
    const mockAvgPerDay = Math.round(mockTotalThisWeek / 7);
    const mockPeakDay = MOCK_WEEK_DAYS[MOCK_WEEK_COUNTS.indexOf(Math.max(...MOCK_WEEK_COUNTS))];

    // Cards due today
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const cardsDueToday = allCards.filter(
        (card) => new Date(card.dueDate) <= todayEnd,
    ).length;

    // Retention rate
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const retentionRate =
        totalCards === 0
            ? 0
            : Math.round(
                (allCards.filter((c) => new Date(c.dueDate) > todayStart)
                    .length /
                    totalCards) *
                100,
            );

    return (
        <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-8 items-center">
            {/* Hidden file input for YAML import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-10">
                <section>
                    <InspirationalQuotes />
                </section>
                <section className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => createDeck()}
                        className="flex items-center gap-2 font-ui text-sm px-5 py-2.5 rounded-lg text-paper transition-all"
                        style={{ backgroundColor: "var(--color-secondary)" }}>
                        <Plus className="w-4 h-4" />
                        Create a deck
                    </button>
                    <button
                        onClick={handleOpenFile}
                        className="flex items-center gap-2 font-ui text-sm px-4 py-2.5 rounded-lg border border-primary/15 text-primary/50 hover:text-primary hover:border-primary/30 transition-all">
                        <FolderOpen className="w-4 h-4" />
                        Import from YAML
                    </button>
                </section>
                {decks.length === 0 && (
                    <section>
                        <div
                            className="flex flex-col items-center gap-5 border border-primary/10 rounded-xl p-10 bg-paper text-center"
                            style={{ boxShadow: "0 2px 12px rgba(35,0,30,0.06)" }}>
                            <div className="flex flex-col gap-2">
                                <p className="font-display text-2xl text-primary">
                                    No decks yet
                                </p>
                                <p className="font-ui text-sm text-primary/40 max-w-xs">
                                    Create a new deck from scratch, or import an existing one from a YAML file.
                                </p>
                            </div>
                        </div>
                    </section>
                )}
                {lastDeck && (
                    <section>
                        <p className="font-ui text-xs uppercase tracking-widest text-primary/35 mb-3">
                            Continue Where You Left Off
                        </p>
                        <div
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-primary/10 rounded-xl p-5 bg-paper"
                            style={{
                                boxShadow: "0 2px 12px rgba(35,0,30,0.06)",
                            }}>
                            <div className="flex flex-col gap-1">
                                <span className="font-display text-2xl text-primary">
                                    {lastDeck.deckName}
                                </span>
                                <span className="font-ui text-xs text-primary/40">
                                    {lastDeck.cards.length} cards · Last studied{" "}
                                    {new Date(
                                        lastDeck.lastUtilized,
                                    ).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() =>
                                        openEditor(lastDeck.deckId)
                                    }
                                    className="flex items-center gap-2 font-ui text-sm px-4 py-2.5 rounded-lg border border-primary/15 text-primary/50 hover:text-primary hover:border-primary/30 transition-all">
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => openTab(lastDeck)}
                                    className="flex items-center gap-2 font-ui text-sm px-5 py-2.5 rounded-lg text-paper transition-all"
                                    style={{
                                        backgroundColor:
                                            "var(--color-secondary)",
                                    }}>
                                    <PlayCircle className="w-4 h-4" />
                                    Resume
                                </button>
                            </div>
                        </div>
                    </section>
                )}
                {pinnedDecks.length > 0 && (
                    <section>
                        <p className="font-ui text-xs uppercase tracking-widest text-primary/35 mb-3">
                            Pinned Decks
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {pinnedDecks.map((deck) => (
                                <div
                                    key={deck.deckId}
                                    className="group flex items-center justify-between border border-primary/10 rounded-xl px-4 py-3 bg-paper transition-colors hover:border-primary/20"
                                    style={{
                                        boxShadow:
                                            "0 2px 12px rgba(35,0,30,0.06)",
                                    }}>
                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                        <span className="font-display text-base text-primary truncate">
                                            {deck.deckName}
                                        </span>
                                        <span className="font-ui text-xs text-primary/40">
                                            {deck.cards.length} cards
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                        <button
                                            onClick={() =>
                                                togglePinDeck(deck.deckId)
                                            }
                                            title="Unpin"
                                            className="p-1 rounded text-yellow-500 opacity-40 hover:opacity-100 transition-opacity">
                                            <Star
                                                className="w-3.5 h-3.5"
                                                fill="currentColor"
                                            />
                                        </button>
                                        <button
                                            onClick={() =>
                                                openEditor(deck.deckId)
                                            }
                                            title="Edit deck"
                                            className="p-1 rounded text-primary/30 hover:text-primary/70 transition-colors">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => openTab(deck)}
                                            className="flex items-center gap-1.5 font-ui text-xs px-3 py-1.5 rounded-lg text-paper transition-all"
                                            style={{
                                                backgroundColor:
                                                    "var(--color-secondary)",
                                            }}>
                                            <PlayCircle className="w-3.5 h-3.5" />
                                            Open
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                <section>
                    <p className="font-ui text-xs uppercase tracking-widest text-primary/35 mb-3">
                        Activity — Last 6 Months
                    </p>
                    <div
                        className="flex flex-col sm:flex-row gap-4 border border-primary/10 rounded-xl p-4 sm:p-5 bg-paper"
                        style={{ boxShadow: "0 2px 12px rgba(35,0,30,0.06)" }}>
                        {/* Heatmap grid */}
                        <div className="overflow-x-auto pb-1 flex-shrink-0">
                            <div className="flex gap-1 min-w-max">
                                {heatmap.map((week, wi) => (
                                    <div key={wi} className="flex flex-col gap-1">
                                        {week.map((val, di) => (
                                            <div
                                                key={di}
                                                className={`w-3 h-3 rounded-sm border border-primary/10 ${heatColor(val)}`}
                                                title={`${Math.round(val * 100)} cards reviewed`}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px bg-primary/10 self-stretch" />
                        <div className="block sm:hidden h-px bg-primary/10 w-full" />

                        {/* Weekly summary */}
                        <div className="flex flex-col justify-between flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-ui text-xs uppercase tracking-widest text-primary/35 mb-1">This Week</p>
                                    <p className="font-display text-3xl text-primary">{mockTotalThisWeek}</p>
                                    <p className="font-ui text-xs text-primary/40 mt-0.5">cards reviewed</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-ui text-xs uppercase tracking-widest text-primary/35 mb-1">Daily Avg</p>
                                    <p className="font-display text-3xl text-primary">{mockAvgPerDay}</p>
                                    <p className="font-ui text-xs text-primary/40 mt-0.5">cards / day</p>
                                </div>
                            </div>
                            {/* Bar chart */}
                            <div className="flex items-end gap-1.5 mt-4">
                                {MOCK_WEEK_DAYS.map((day, i) => {
                                    const pct = MOCK_WEEK_COUNTS[i] / Math.max(...MOCK_WEEK_COUNTS);
                                    return (
                                        <div key={day} className="flex flex-col items-center gap-1 flex-1">
                                            <div
                                                className="w-full rounded-sm"
                                                style={{
                                                    height: `${Math.round(pct * 48)}px`,
                                                    backgroundColor: `color-mix(in srgb, var(--color-secondary) ${Math.round(pct * 80 + 20)}%, transparent)`,
                                                }}
                                            />
                                            <span className="font-ui text-xs text-primary/30">{day}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="font-ui text-xs text-primary/35 mt-3">
                                Peak day: <span className="text-secondary font-semibold">{mockPeakDay}</span> · {Math.max(...MOCK_WEEK_COUNTS)} cards
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        {
                            icon: <TrendingUp className="w-4 h-4" />,
                            label: "Retention Rate",
                            value: `${retentionRate}%`,
                        },
                        {
                            icon: <Calendar className="w-4 h-4" />,
                            label: "Cards Due Today",
                            value: cardsDueToday.toString(),
                        },
                        {
                            icon: <Flame className="w-4 h-4" />,
                            label: "Best Streak",
                            value: `${totalStreak} days`,
                        },
                    ].map(({ icon, label, value }) => (
                        <div
                            key={label}
                            className="border border-primary/10 rounded-xl p-5 bg-paper"
                            style={{
                                boxShadow: "0 2px 12px rgba(35,0,30,0.06)",
                            }}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-secondary">{icon}</span>
                                <span className="font-ui text-xs uppercase tracking-widest text-primary/40">
                                    {label}
                                </span>
                            </div>
                            <div className="font-display text-4xl text-primary">
                                {value}
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
