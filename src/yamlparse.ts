import YAML from "yaml";
import { IDeck, ICard } from "@/types/types";

/**
 * Parses a YAML string into an IDeck object.
 * Web-compatible version (no Node.js fs or Electron APIs).
 */
export function parseYamlString(content: string, filename = "deck.yaml"): IDeck | undefined {
    try {
        const myData = YAML.parse(content);

        const cardLists: Array<ICard> = [];
        const randomUUID = crypto.randomUUID();
        const deckId = myData["deckId"] || randomUUID;

        for (let i = 0; i < (myData["cards"] ?? []).length; i++) {
            const curr = myData["cards"][i];

            if (!Object.prototype.hasOwnProperty.call(curr, "question")) {
                throw new Error(`Card #${i} is missing a question.`);
            }
            if (!Object.prototype.hasOwnProperty.call(curr, "answer")) {
                throw new Error(
                    `Card #${i}, with question: ${curr["question"]} is missing an answer.`,
                );
            }

            const card: ICard = {
                deckId,
                cardId: curr["cardId"]
                    ? String(curr["cardId"])
                    : `${deckId}-${i}`,
                question: curr["question"],
                answer: curr["answer"],
                laters: curr["laters"] ?? 0,
                dueDate: curr["dueDate"] ? new Date(curr["dueDate"]) : new Date(),
            };
            cardLists.push(card);
        }

        const baseName = filename.replace(/\.ya?ml$/i, "");
        const newDeck: IDeck = {
            deckId,
            deckName: myData["name"] || myData["deckName"] || baseName,
            filepath: myData["filepath"] || "",
            lastUpdated: myData["lastUpdated"]
                ? new Date(myData["lastUpdated"])
                : new Date(),
            created: myData["created"]
                ? new Date(myData["created"])
                : new Date(),
            lastUtilized: myData["lastUtilized"]
                ? new Date(myData["lastUtilized"])
                : new Date(),
            uses: myData["uses"] ?? 0,
            streak: myData["streak"] ?? 0,
            cards: cardLists,
        };
        return newDeck;
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("YAML parse error:", msg);
        alert("Failed to parse YAML: " + msg);
        return undefined;
    }
}
