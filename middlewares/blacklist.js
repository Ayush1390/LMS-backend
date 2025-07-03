// blacklist.js
const blacklist = new Set();

export const addToBlacklist = (token) => {
  blacklist.add(token);
};

export const isBlacklisted = (token) => {
  return blacklist.has(token);
};
