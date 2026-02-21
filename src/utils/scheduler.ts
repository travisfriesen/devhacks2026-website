import { ICard } from "@/types/types";

export function fibonacci(n: number): number {
    let fib1 = 3;
    let fib2 = 5;
    let result = 0;

    if (n == 0) {
        result = fib1;
    } else if (n == 1) {
        result = fib2;
    } else {
        while (n >= 2) {
            n--;
            const temp = fib2;
            fib2 = fib1 + fib2;
            fib1 = temp;
        }
        result = fib2;
    }

    return result;
}

export type RecallRating = 1 | 2 | 3 | 4; // again | later-session | next-session | later

function incrementDate(date: Date, addAmt: number): Date {
    let day = date.getUTCDate();
    let month = date.getUTCMonth();
    let year = date.getUTCFullYear();

    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    while (addAmt > 0) {
        if (day + addAmt > monthDays[month]) {
            addAmt = addAmt - (monthDays[month] - day + 1);
            day = 1;
            month++;
        } else {
            day += addAmt;
            addAmt = 0;
        }
    }

    year += Math.floor(month / 12);
    month = month % 12;

    return new Date(Date.UTC(year, month, day));
}

export function scheduleCard(card: ICard, rating: RecallRating): ICard {
    let updatedCard = { ...card };

    switch (rating) {
        case 1: // again — handled in UI logic
            break;
        case 2: // later-session — handled in UI logic
            break;
        case 3: {
            // next session — due tomorrow
            const tomorrow = incrementDate(card.dueDate, 1);
            updatedCard = { ...updatedCard, dueDate: tomorrow };
            break;
        }
        case 4: {
            // later — fibonacci backoff
            const newDueDate = incrementDate(
                card.dueDate,
                fibonacci(card.laters),
            );
            updatedCard = {
                ...updatedCard,
                dueDate: newDueDate,
                laters: card.laters + 1,
            };
            break;
        }
    }

    return updatedCard;
}
