import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! 👋 I'm your shopping assistant. Ask me anything like \"cheap phones under 15000\" or \"best gaming laptops\".",
      products: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId") || "guest";
      const data = await API.post("/products/chat", {
        message: text,
        userId,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.reply,
          products: data.products || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Sorry, something went wrong. Please try again!",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating toggle button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center text-2xl"
        aria-label="Toggle chat"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* ── Chat window ── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[560px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <p className="font-semibold text-sm">Shopping Assistant</p>
              <p className="text-xs text-indigo-200">
                Ask me to find products for you
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 min-h-[280px] max-h-[380px]">
            {messages.map((msg, i) => (
              <div key={i}>
                {/* Text bubble */}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "ml-auto bg-indigo-600 text-white rounded-br-none"
                      : "mr-auto bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Product cards (bot only) */}
                {msg.products?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.products.slice(0, 5).map((p) => (
                      <div
                        key={p._id}
                        onClick={() => {
                          navigate(`/product/${p._id}`);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-indigo-400 hover:shadow transition-all"
                      >
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-12 h-12 object-cover rounded-md"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/48?text=No+Img";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-indigo-600 font-bold text-xs">
                              Rs {p.price?.toLocaleString()}
                            </span>
                            {p.rating && (
                              <span className="text-yellow-500 text-xs">
                                ⭐ {p.rating}
                              </span>
                            )}
                          </div>
                          {p.brand && (
                            <span className="text-[10px] text-gray-400">
                              {p.brand}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-300 text-lg">›</span>
                      </div>
                    ))}
                    {msg.products.length > 5 && (
                      <p className="text-xs text-center text-gray-400">
                        +{msg.products.length - 5} more results
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl w-fit border border-gray-200 shadow-sm">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-200 bg-white flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about products..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
