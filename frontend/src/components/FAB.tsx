import { motion } from 'motion/react';
import React from 'react';
import { IoChatbubbleEllipsesOutline, IoClose } from 'react-icons/io5';

import { useApp } from '../hooks/useApp';
import { RiChatAiLine } from 'react-icons/ri';

const FAB: React.FC = () => {
  const { chat, toggleChat } = useApp();

  return (
    <motion.button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center justify-center transition-colors duration-200"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <motion.div
        initial={false}
        animate={{ rotate: chat.isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {chat.isOpen ? (
          <IoClose size={24} />
        ) : (
          <RiChatAiLine size={24} />
        )}
      </motion.div>
    </motion.button>
  );
};

export default FAB;