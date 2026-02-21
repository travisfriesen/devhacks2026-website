import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Download, List, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ICard, IDeck } from "@/types/types";
import Editor from "@/pages/Editor";
import { deckToYaml } from "@/utils/deckToYaml";

/**
 * Triggers a browser download of the deck as a YAML file.
 */
function downloadDeckAsYaml(deck: IDeck) {
    const content = deckToYaml(deck);
    const blob = new Blob([content], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.deckName.replace(/[^a-z0-9_\-. ]/gi, "_")}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function EditorPage() {
    const {
        decks,
        editingDeckId,
        editingCardId,
        updateCard,
        addCard,
        deleteCard,
        setNavView,
    } = useAppStore();

    const deck = decks.find((d) => d.deckId === editingDeckId);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(
        (editingCardId && deck?.cards.find((c) => c.cardId === editingCardId))
            ? editingCardId
            : (deck?.cards[0]?.cardId ?? null),
    );
    const [cardListOpen, setCardListOpen] = useState(false);

    // When the store navigates to a specific card, sync the selection.
    useEffect(() => {
        if (editingCardId) setSelectedCardId(editingCardId);
    }, [editingCardId]);

    const handleBack = () => setNavView("decks");

    const handleDownload = () => {
        if (deck) downloadDeckAsYaml(deck);
    };

    const handleAddCard = () => {
        if (!deck) return;
        const newCard: ICard = {
            deckId: deck.deckId,
            cardId: `${deck.deckId}-${crypto.randomUUID()}`,
            question: "",
            answer: "",
            laters: 0,
            dueDate: new Date(),
        };
        addCard(deck.deckId, newCard);
        setSelectedCardId(newCard.cardId);
    };

    const handleDeleteCard = (cardId: string) => {
        if (!deck) return;
        const idx = deck.cards.findIndex((c) => c.cardId === cardId);
        deleteCard(deck.deckId, cardId);
        const remaining = deck.cards.filter((c) => c.cardId !== cardId);
        setSelectedCardId(
            remaining.length === 0
                ? null
                : remaining[Math.min(idx, remaining.length - 1)].cardId,
        );
    };

    const handleSetCard = (updated: ICard) => {
        if (!deck) return;
        updateCard(deck.deckId, updated);
    };

    if (!deck) {
        return (
            <div className="flex items-center justify-center h-full font-ui text-primary/40">
                No deck selected.
            </div>
        );
    }

    const selectedCard =
        deck.cards.find((c) => c.cardId === selectedCardId) ?? null;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 border-b border-primary/10">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 font-ui text-sm text-primary/40 hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-display text-xl sm:text-2xl text-primary truncate">
                        {deck.deckName}
                    </h1>
                    <p className="font-ui text-xs text-primary/40 mt-0.5 hidden sm:block">
                        {deck.cards.length} card
                        {deck.cards.length !== 1 ? "s" : ""} · changes saved
                        automatically
                    </p>
                </div>
                {/* Mobile: toggle card list */}
                <button
                    onClick={() => setCardListOpen((v) => !v)}
                    title="Card list"
                    className="flex md:hidden items-center gap-1 font-ui text-sm px-3 py-2 rounded-lg border border-primary/15 text-primary/50 hover:text-primary hover:border-primary/30 transition-all">
                    {cardListOpen ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
                    <span className="text-xs">{deck.cards.length} cards</span>
                </button>
                <button
                    onClick={handleDownload}
                    title="Download as YAML"
                    className="flex items-center gap-2 font-ui text-sm px-3 sm:px-4 py-2 rounded-lg border border-primary/15 text-primary/50 hover:text-primary hover:border-primary/30 transition-all">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>
                <button
                    onClick={handleAddCard}
                    className="flex items-center gap-2 font-ui text-sm px-3 sm:px-4 py-2 rounded-lg text-paper transition-all"
                    style={{ backgroundColor: "var(--color-secondary)" }}>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Card</span>
                </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Card list sidebar — always visible on md+, toggled on mobile */}
                <div
                    className={[
                        "shrink-0 border-r border-primary/10 overflow-y-auto py-2",
                        "absolute md:relative z-10 bg-paper md:bg-transparent shadow-lg md:shadow-none",
                        "w-56",
                        cardListOpen ? "block" : "hidden md:block",
                    ].join(" ")}
                    style={{ top: 0, bottom: 0, left: 0 }}>
                    {deck.cards.length === 0 ? (
                        <p className="font-ui text-xs text-primary/30 px-4 py-3">
                            No cards yet.
                        </p>
                    ) : (
                        deck.cards.map((card, i) => {
                            const isSelected = card.cardId === selectedCardId;
                            return (
                                <div
                                    key={card.cardId}
                                    className="group flex items-center gap-1 px-3 py-1">
                                    <button
                                        onClick={() => {
                                            setSelectedCardId(card.cardId);
                                            setCardListOpen(false);
                                        }}
                                        className="flex-1 text-left font-ui text-xs px-2 py-2 rounded-lg truncate transition-colors"
                                        style={{
                                            backgroundColor: isSelected
                                                ? "rgba(185,49,79,0.10)"
                                                : "transparent",
                                            color: isSelected
                                                ? "var(--color-primary)"
                                                : "rgba(35,0,30,0.45)",
                                            borderLeft: isSelected
                                                ? "2px solid var(--color-secondary)"
                                                : "2px solid transparent",
                                        }}>
                                        {card.question
                                            ? card.question
                                                .replace(/[#*`$\\]/g, "")
                                                .trim()
                                                .slice(0, 28) ||
                                            `Card ${i + 1}`
                                            : `Card ${i + 1}`}
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDeleteCard(card.cardId)
                                        }
                                        className="shrink-0 p-1 rounded text-primary/20 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                                        title="Delete card">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Editor pane */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
                    {selectedCard ? (
                        <Editor
                            card={selectedCard}
                            setCard={handleSetCard}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                            <p className="font-display text-2xl text-primary/40">
                                No card selected
                            </p>
                            <p className="font-ui text-sm text-primary/30">
                                Click "Add Card" to get started.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
