export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const roundMoney = (value) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

export const toIsoDate = (date = new Date()) => new Date(date).toISOString();

export const compactObject = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

export const parseJson = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};
