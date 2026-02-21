import { create } from "zustand";
import { persist, StorageValue } from "zustand/middleware";
import { ICard, IDeck } from "@/types/types";
import { RecallRating, scheduleCard } from "@/utils/scheduler";
import { FontSize, applyTheme } from "@/utils/applyTheme";

// Custom storage that revives ISO date strings back into Date objects on read.
const isoDateRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
function dateReviver(_key: string, value: unknown): unknown {
    if (typeof value === "string" && isoDateRe.test(value))
        return new Date(value);
    return value;
}

const dateAwareStorage = {
    getItem: (name: string): StorageValue<Partial<AppState>> | null => {
        const str = localStorage.getItem(name);
        if (!str) return null;
        return JSON.parse(str, dateReviver) as StorageValue<Partial<AppState>>;
    },
    setItem: (name: string, value: StorageValue<Partial<AppState>>) => {
        localStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name: string) => {
        localStorage.removeItem(name);
    },
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export type NavView = "decks" | "search" | "settings" | "editor";

export interface ITab {
    tabId: string;
    deck: IDeck;
    flipped: boolean;
    queue: ICard[];
    history: ICard[];
    completed: number;
    totalCards: number;
}

interface AppState {
    loadDecksFromDB: () => Promise<void>;

    navView: NavView;
    setNavView: (view: NavView) => void;

    sidebarVisible: boolean;
    toggleSidebar: () => void;

    decks: IDeck[];
    setDecks: (decks: IDeck[]) => void;

    pinnedDeckIds: string[];
    togglePinDeck: (deckId: string) => void;

    tabs: ITab[];
    activeTabId: string | null;
    openTab: (deck: IDeck) => void;
    closeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;

    nextCard: (tabId: string) => void;
    prevCard: (tabId: string) => void;
    flipCard: (tabId: string) => void;
    answerCard: (tabId: string, rating: RecallRating) => void;

    dailyGoal: number;
    setDailyGoal: (n: number) => void;
    reviewHistory: Record<string, number>;
    incrementReviewed: () => void;

    editingDeckId: string | null;
    editingCardId: string | null;
    openEditor: (deckId: string, cardIdOrFilepath?: string) => void;
    createDeck: (name?: string) => Promise<void>;
    renameDeck: (deckId: string, newName: string) => void;
    removeDeck: (deckId: string) => void;
    updateDeckFilepath: (deckId: string, filepath: string) => void;
    updateCard: (deckId: string, card: ICard) => void;
    addCard: (deckId: string, card: ICard) => void;
    deleteCard: (deckId: string, cardId: string) => void;

    themePreset: string;
    setThemePreset: (name: string) => void;
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    uiFont: string;
    setUiFont: (font: string) => void;
    displayFont: string;
    setDisplayFont: (font: string) => void;

    editorPreference: string;
    setEditorPreference: (pref: string) => void;

    // Web-only: import a deck from a parsed IDeck object
    importDeck: (deck: IDeck) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // On the web, decks are persisted via localStorage — no DB call needed.
            loadDecksFromDB: () => Promise.resolve(),

            navView: "decks",
            setNavView: (view) => set({ navView: view, activeTabId: null }),

            sidebarVisible: true,
            toggleSidebar: () =>
                set((state) => ({ sidebarVisible: !state.sidebarVisible })),

            tabs: [],
            activeTabId: null,

            decks: [],
            setDecks: (decks) => set({ decks }),

            pinnedDeckIds: [],
            togglePinDeck: (deckId) =>
                set((state) => ({
                    pinnedDeckIds: state.pinnedDeckIds.includes(deckId)
                        ? state.pinnedDeckIds.filter((id) => id !== deckId)
                        : [...state.pinnedDeckIds, deckId],
                })),

            dailyGoal: 20,
            setDailyGoal: (n) => set({ dailyGoal: n }),
            reviewHistory: {},
            incrementReviewed: () =>
                set((state) => {
                    const today = todayStr();
                    return {
                        reviewHistory: {
                            ...state.reviewHistory,
                            [today]: (state.reviewHistory[today] ?? 0) + 1,
                        },
                    };
                }),

            editingDeckId: null,
            editingCardId: null,

            openEditor: (deckId, cardIdOrFilepath) => {
                // On the web, always use the built-in web editor.
                // cardIdOrFilepath is treated as a cardId if it matches a card in the deck.
                const deck = get().decks.find((d) => d.deckId === deckId);
                const cardId = deck?.cards.find(
                    (c) => c.cardId === cardIdOrFilepath,
                )?.cardId ?? null;
                set({
                    navView: "editor",
                    editingDeckId: deckId,
                    editingCardId: cardId,
                });
            },

            createDeck: async (name) => {
                const deckName = name?.trim() || "New Deck";
                const deckId = crypto.randomUUID();
                const now = new Date();
                const newDeck: IDeck = {
                    deckId,
                    deckName,
                    filepath: "",
                    lastUpdated: now,
                    created: now,
                    lastUtilized: now,
                    uses: 0,
                    streak: 0,
                    cards: [],
                };
                set((state) => ({ decks: [...state.decks, newDeck] }));
                get().openEditor(deckId);
            },

            renameDeck: (deckId, newName) => {
                set((state) => ({
                    decks: state.decks.map((d) =>
                        d.deckId === deckId ? { ...d, deckName: newName } : d,
                    ),
                }));
            },

            removeDeck: (deckId) => {
                const tabToClose = get().tabs.find(
                    (t) => t.deck.deckId === deckId,
                );
                if (tabToClose) get().closeTab(tabToClose.tabId);
                set((state) => ({
                    decks: state.decks.filter((d) => d.deckId !== deckId),
                    pinnedDeckIds: state.pinnedDeckIds.filter(
                        (id) => id !== deckId,
                    ),
                    ...(state.editingDeckId === deckId
                        ? {
                              editingDeckId: null,
                              editingCardId: null,
                              navView: "decks" as NavView,
                          }
                        : {}),
                }));
            },

            updateDeckFilepath: (deckId, filepath) => {
                set((state) => ({
                    decks: state.decks.map((d) =>
                        d.deckId === deckId ? { ...d, filepath } : d,
                    ),
                }));
            },

            updateCard: (deckId, card) => {
                const patchCard = (c: ICard) =>
                    c.cardId === card.cardId ? card : c;
                set((state) => ({
                    decks: state.decks.map((d) =>
                        d.deckId === deckId
                            ? { ...d, cards: d.cards.map(patchCard) }
                            : d,
                    ),
                    tabs: state.tabs.map((tab) =>
                        tab.deck.deckId === deckId
                            ? {
                                  ...tab,
                                  queue: tab.queue.map(patchCard),
                                  history: tab.history.map(patchCard),
                                  deck: {
                                      ...tab.deck,
                                      cards: tab.deck.cards.map(patchCard),
                                  },
                              }
                            : tab,
                    ),
                }));
            },

            addCard: (deckId, card) => {
                set((state) => ({
                    decks: state.decks.map((d) =>
                        d.deckId === deckId
                            ? { ...d, cards: [...d.cards, card] }
                            : d,
                    ),
                }));
            },

            deleteCard: (deckId, cardId) => {
                set((state) => ({
                    decks: state.decks.map((d) =>
                        d.deckId === deckId
                            ? {
                                  ...d,
                                  cards: d.cards.filter(
                                      (c) => c.cardId !== cardId,
                                  ),
                              }
                            : d,
                    ),
                }));
            },

            openTab: (deck) => {
                const now = new Date();
                const updatedDeck = { ...deck, lastUtilized: now };

                const existingTab = get().tabs.find(
                    (tab) => tab.deck.deckId === deck.deckId,
                );

                if (existingTab) {
                    set((state) => ({
                        activeTabId: existingTab.tabId,
                        decks: state.decks.map((d) =>
                            d.deckId === deck.deckId
                                ? { ...d, lastUtilized: now, uses: d.uses + 1 }
                                : d,
                        ),
                    }));
                    return;
                }

                const tabId = `tab-${deck.deckId}-${Date.now()}`;
                const queue = [...deck.cards];
                const newTab: ITab = {
                    tabId,
                    deck: updatedDeck,
                    queue,
                    history: [],
                    totalCards: queue.length,
                    completed: 0,
                    flipped: false,
                };

                set((state) => ({
                    tabs: [...state.tabs, newTab],
                    activeTabId: tabId,
                    navView: "decks",
                    decks: state.decks.map((d) =>
                        d.deckId === deck.deckId
                            ? { ...d, lastUtilized: now, uses: d.uses + 1 }
                            : d,
                    ),
                }));
            },

            closeTab: (tabId) => {
                set((state) => {
                    const index = state.tabs.findIndex(
                        (tab) => tab.tabId === tabId,
                    );
                    const newTabs = state.tabs.filter(
                        (tab) => tab.tabId !== tabId,
                    );
                    let newActiveId = state.activeTabId;

                    if (state.activeTabId === tabId) {
                        if (newTabs.length === 0) {
                            newActiveId = null;
                        } else if (index === 0) {
                            newActiveId = newTabs[0].tabId;
                        } else {
                            newActiveId = newTabs[index - 1].tabId;
                        }
                    }

                    return { tabs: newTabs, activeTabId: newActiveId };
                });
            },

            setActiveTab: (tabId) => set({ activeTabId: tabId }),

            nextCard: (tabId) => {
                set((state) => ({
                    tabs: state.tabs.map((tab) => {
                        if (tab.tabId !== tabId || tab.queue.length === 0)
                            return tab;

                        const [current, ...rest] = tab.queue;
                        return {
                            ...tab,
                            queue: rest,
                            completed: tab.completed + 1,
                            history: [...tab.history, current],
                            flipped: false,
                        };
                    }),
                }));
                get().incrementReviewed();
            },

            prevCard: (tabId) => {
                set((state) => ({
                    tabs: state.tabs.map((tab) => {
                        if (tab.tabId !== tabId || tab.history.length === 0)
                            return tab;

                        const prev = tab.history[tab.history.length - 1];
                        return {
                            ...tab,
                            queue: [prev, ...tab.queue],
                            history: tab.history.slice(0, -1),
                            completed: tab.completed - 1,
                            flipped: false,
                        };
                    }),
                }));
            },

            answerCard: (tabId, rating) => {
                const currentTab = get().tabs.find((t) => t.tabId === tabId);
                if (!currentTab || currentTab.queue.length === 0) return;
                const [currentCard] = currentTab.queue;
                const updatedCard = scheduleCard(currentCard, rating);

                set((state) => ({
                    tabs: state.tabs.map((tab) => {
                        if (tab.tabId !== tabId || tab.queue.length === 0)
                            return tab;
                        const [, ...rest] = tab.queue;
                        const updatedDeckCards = tab.deck.cards.map((c) =>
                            c.cardId === updatedCard.cardId ? updatedCard : c,
                        );
                        const isPermanentlyScheduled =
                            rating === 3 || rating === 4;
                        let newQueue: ICard[];
                        if (isPermanentlyScheduled) {
                            newQueue = rest;
                        } else if (rating === 1) {
                            newQueue = [updatedCard, ...rest];
                        } else {
                            const mid = Math.ceil(rest.length / 2);
                            newQueue = [
                                ...rest.slice(0, mid),
                                updatedCard,
                                ...rest.slice(mid),
                            ];
                        }
                        return {
                            ...tab,
                            queue: newQueue,
                            flipped: false,
                            completed: isPermanentlyScheduled
                                ? tab.completed + 1
                                : tab.completed,
                            history: isPermanentlyScheduled
                                ? [...tab.history, currentCard]
                                : tab.history,
                            deck: { ...tab.deck, cards: updatedDeckCards },
                        };
                    }),
                    // Also persist updated card scheduling in decks
                    decks: state.decks.map((d) =>
                        d.deckId === currentCard.deckId
                            ? {
                                  ...d,
                                  cards: d.cards.map((c) =>
                                      c.cardId === updatedCard.cardId
                                          ? updatedCard
                                          : c,
                                  ),
                              }
                            : d,
                    ),
                }));

                get().incrementReviewed();
            },

            flipCard: (tabId) => {
                set((state) => ({
                    tabs: state.tabs.map((tab) =>
                        tab.tabId === tabId
                            ? { ...tab, flipped: !tab.flipped }
                            : tab,
                    ),
                }));
            },

            themePreset: "Default",
            setThemePreset: (name) =>
                set((state) => {
                    applyTheme({
                        themePreset: name,
                        fontSize: state.fontSize,
                        uiFont: state.uiFont,
                        displayFont: state.displayFont,
                    });
                    return { themePreset: name };
                }),

            fontSize: "md",
            setFontSize: (size) =>
                set((state) => {
                    applyTheme({
                        themePreset: state.themePreset,
                        fontSize: size,
                        uiFont: state.uiFont,
                        displayFont: state.displayFont,
                    });
                    return { fontSize: size };
                }),

            uiFont: '"Plus Jakarta Sans", sans-serif',
            setUiFont: (font) =>
                set((state) => {
                    applyTheme({
                        themePreset: state.themePreset,
                        fontSize: state.fontSize,
                        uiFont: font,
                        displayFont: state.displayFont,
                    });
                    return { uiFont: font };
                }),

            displayFont: '"Lexend", serif',
            setDisplayFont: (font) =>
                set((state) => {
                    applyTheme({
                        themePreset: state.themePreset,
                        fontSize: state.fontSize,
                        uiFont: state.uiFont,
                        displayFont: font,
                    });
                    return { displayFont: font };
                }),

            editorPreference: "Web Editor",
            setEditorPreference: (pref) => set({ editorPreference: pref }),

            importDeck: (deck) => {
                set((state) => {
                    const exists = state.decks.find(
                        (d) => d.deckId === deck.deckId,
                    );
                    if (exists) {
                        // Replace existing deck with imported version
                        return {
                            decks: state.decks.map((d) =>
                                d.deckId === deck.deckId ? deck : d,
                            ),
                        };
                    }
                    return { decks: [...state.decks, deck] };
                });
            },
        }),
        {
            name: "devhacks-web-store",
            storage: dateAwareStorage,
            partialize: (state) => ({
                decks: state.decks,
                pinnedDeckIds: state.pinnedDeckIds,
                dailyGoal: state.dailyGoal,
                reviewHistory: state.reviewHistory,
                themePreset: state.themePreset,
                fontSize: state.fontSize,
                uiFont: state.uiFont,
                displayFont: state.displayFont,
                editorPreference: state.editorPreference,
            }),
        },
    ),
);
