"use client";

import { useState, useRef, useEffect } from "react";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function BootieWidget() {

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hola, soy Bootie. ¿En qué puedo ayudarte hoy?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = "square"; // Sonido robótico
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Frecuencia alta (beep)
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); // Baja rápido (blip)

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.error("Error al reproducir sonido:", e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const assistantMessage: Message = {
                role: "assistant",
                content: data.response,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            playBeep(); // ¡Bip! al recibir respuesta
        } catch (error) {
            const errorMessage: Message = {
                role: "assistant",
                content:
                    "Algo salió mal en mi sistema. Por favor intenta de nuevo.",
            };
            setMessages((prev) => [...prev, errorMessage]);
            playBeep(); // ¡Bip! de error
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <>
            {/* Contenedor del Botón flotante y Etiqueta */}
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
                {/* Etiqueta estilo Banesco */}
                {!isOpen && (
                    <div
                        onClick={() => setIsOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-5 py-2.5 rounded-l-full rounded-tr-full shadow-xl font-bold text-sm cursor-pointer hover:scale-105 transition-all duration-300 animate-in fade-in slide-in-from-right-5 hidden md:block border-y border-l border-white/20"
                    >
                        Chatea con Bootie
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-16 h-16 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] hover:scale-110 transition-all duration-300 flex items-center justify-center group border-2 border-blue-500/10 overflow-hidden"
                    aria-label="Abrir chat con Bootie"
                >
                    {!isOpen ? (
                        <img src="/bootieFgris.png" alt="Bootie" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </button>
            </div>

            {/* Ventana de chat */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 h-[32rem] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-0.5 shadow-inner overflow-hidden border-2 border-white/20">
                                <img src="/bootieFgris.png" alt="Bootie Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight notranslate" translate="no">Bootie</h3>
                                <p className="text-[10px] uppercase tracking-wider font-medium opacity-90">Asistente Virtual</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform duration-300 opacity-70 hover:opacity-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-full bg-white flex-shrink-0 border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center">
                                        <img src="/bootieFgris.png" alt="B" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 ${msg.role === "user"
                                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none"
                                        : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-600"
                                        }`}
                                >
                                    <div className="text-[13.5px] leading-relaxed markdown-content">
                                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-end gap-2">
                                <div className="w-8 h-8 rounded-full bg-white flex-shrink-0 border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center">
                                    <img src="/bootieFgris.png" alt="B" className="w-full h-full object-cover animate-pulse" />
                                </div>
                                <div className="bg-white dark:bg-gray-700 rounded-2xl px-5 py-3 shadow-sm border border-gray-100 dark:border-gray-600 rounded-bl-none">
                                    <div className="flex space-x-1.5">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe tu pregunta..."
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
