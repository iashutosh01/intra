import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { env } from '../config/env.js';
import { SHEET_HEADERS, SHEETS } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import fs from "fs";


let documentPromise;

const assertGoogleConfig = () => {
  if (!env.googleSheetId || !env.googleServiceAccountEmail || !env.googlePrivateKey) {
    throw new AppError('Google Sheets credentials are not configured', 503);
  }
};

// if (!env.googleSheetId || !env.googleServiceAccount) {
//     throw new AppError("Google Sheets credentials are not configured",503);
// }

export const getSpreadsheet = async () => {
  assertGoogleConfig();
  if (!documentPromise) {
    const serviceAccountAuth = new JWT({
      email: env.googleServiceAccountEmail,
      key: env.googlePrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const doc = new GoogleSpreadsheet(env.googleSheetId, serviceAccountAuth);
    documentPromise = doc.loadInfo().then(() => doc);
  }
  return documentPromise;
};

export const getSheet = async (title) => {
  const doc = await getSpreadsheet();
  let sheet = doc.sheetsByTitle[title];
  if (!sheet) {
    sheet = await doc.addSheet({ title, headerValues: SHEET_HEADERS[title] });
  } else {
    await sheet.loadHeaderRow();
    const missingHeaders = SHEET_HEADERS[title].filter((header) => !sheet.headerValues.includes(header));
    if (missingHeaders.length) {
      await sheet.setHeaderRow([...sheet.headerValues, ...missingHeaders]);
    }
  }
  return sheet;
};

export const ensureWorkbook = async () => {
  await Promise.all(Object.values(SHEETS).map((title) => getSheet(title)));
};
