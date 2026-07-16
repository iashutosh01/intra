import { SHEET_HEADERS } from '../constants/index.js';
import { getCached, invalidateCache, setCached } from './cache.js';
import { getSheet } from './sheetsClient.js';

const rowToObject = (row, title) => {
  const object = {};
  for (const header of SHEET_HEADERS[title]) object[header] = row.get(header) || '';
  return object;
};

export const listRows = async (title, useCache = true) => {
  const cacheKey = `sheet:${title}`;
  if (useCache) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }
  const sheet = await getSheet(title);
  const rows = await sheet.getRows();
  const data = rows.map((row) => rowToObject(row, title));
  setCached(cacheKey, data);
  return data;
};

export const addRow = async (title, data) => {
  const sheet = await getSheet(title);
  const payload = {};
  for (const header of SHEET_HEADERS[title]) payload[header] = data[header] ?? '';
  const row = await sheet.addRow(payload);
  invalidateCache(`sheet:${title}`);
  return rowToObject(row, title);
};

export const updateRow = async (title, idField, idValue, updates) => {
  const sheet = await getSheet(title);
  const rows = await sheet.getRows();
  const row = rows.find((item) => item.get(idField) === idValue);
  if (!row) return null;
  for (const [key, value] of Object.entries(updates)) {
    if (SHEET_HEADERS[title].includes(key)) row.set(key, value ?? '');
  }
  await row.save();
  invalidateCache(`sheet:${title}`);
  return rowToObject(row, title);
};

export const upsertRow = async (title, idField, idValue, data) => {
  const updated = await updateRow(title, idField, idValue, data);
  if (updated) return updated;
  return addRow(title, { ...data, [idField]: idValue });
};

export const deleteRow = async (title, idField, idValue) => {
  const sheet = await getSheet(title);
  const rows = await sheet.getRows();
  const row = rows.find((item) => item.get(idField) === idValue);
  if (!row) return null;
  const snapshot = rowToObject(row, title);
  await row.delete();
  invalidateCache(`sheet:${title}`);
  return snapshot;
};

export const deleteRowsBy = async (title, idField, idValue) => {
  const sheet = await getSheet(title);
  const rows = await sheet.getRows();
  const matches = rows.filter((item) => item.get(idField) === idValue);
  const snapshots = matches.map((row) => rowToObject(row, title));
  for (const row of matches) await row.delete();
  invalidateCache(`sheet:${title}`);
  return snapshots;
};
