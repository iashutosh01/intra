import { env } from '../config/env.js';

const cache = new Map();

export const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.createdAt > env.cacheTtlMs) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

export const setCached = (key, value) => {
  cache.set(key, { value, createdAt: Date.now() });
};

export const invalidateCache = (key = null) => {
  if (key) cache.delete(key);
  else cache.clear();
};
