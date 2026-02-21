import React from "react";

const InspirationalQuotes = () => {
    // Static collection of quotes since we can't use the Node.js inspirational-quotes package
    const quotes = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
        { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
        { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
    ];

    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    return (
        <div className="flex flex-col items-center text-primary/50">
            <p>"{quote.text}"</p>
            <span>- {quote.author}</span>
        </div>
    );
};

export default InspirationalQuotes;
