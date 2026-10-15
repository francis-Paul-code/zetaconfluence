import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { IoSend, IoTrashOutline } from 'react-icons/io5';

import { useApp } from '../hooks/useApp';
import { useChat } from '../hooks/useChat';

const ChatBox: React.FC = () => {
  const { chat, clearChat } = useApp();
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageToSend = input;
    setInput('');
    await sendMessage(messageToSend);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearChat();
    }
  };

  return (
    <AnimatePresence>
      {chat.isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-22 right-6 z-40 w-96 h-[550px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                ZetaConfluence Assistant
              </h3>
              <p className="text-xs opacity-90">
                Ask me anything about the platform
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Clear chat"
              >
                <IoTrashOutline size={18} />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div className="space-y-2">
                  <p className="text-gray-500 dark:text-gray-400">
                    Hi! I'm your ZetaConfluence assistant.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Ask me about loans, bids, or how to use the platform.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-white/70'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 flex items-center space-x-2">
                  <AiOutlineLoading3Quarters
                    className="animate-spin text-primary"
                    size={16}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Thinking...
                  </span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="w-full flex items-center border-t border-gray-200 dark:border-gray-700 p-4 gap-2">
            <input
              type="text"
              value={input}
              onFocus={(e) => {
                e.target.addEventListener('keypress', (_e: KeyboardEvent) => {
                  
                  if (_e.key === 'Enter') {
                    _e.preventDefault();
                    handleSubmit(e);
                  }
                });
              }}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full flex-grow px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className=" p-2 rounded-full shrink-0 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IoSend size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatBox;
