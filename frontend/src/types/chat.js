// Helper functions to create chat and message objects
export const createMessage = (id, content, role, timestamp = new Date()) => ({
  id,
  content,
  role, // 'user' or 'assistant'
  timestamp
});

export const createChat = (id, title, messages = [], createdAt = new Date(), updatedAt = new Date()) => ({
  id,
  title,
  messages,
  createdAt,
  updatedAt
});

// Validation functions (optional, for runtime checking)
export const isValidMessage = (message) => {
  return message && 
         typeof message.id === 'string' &&
         typeof message.content === 'string' &&
         ['user', 'assistant'].includes(message.role) &&
         message.timestamp instanceof Date;
};

export const isValidChat = (chat) => {
  return chat &&
         typeof chat.id === 'string' &&
         typeof chat.title === 'string' &&
         Array.isArray(chat.messages) &&
         chat.createdAt instanceof Date &&
         chat.updatedAt instanceof Date;
};