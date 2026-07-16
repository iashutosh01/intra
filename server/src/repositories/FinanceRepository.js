import { SHEETS } from '../constants/index.js';
import { listRows } from '../googleSheets/sheetsRepository.js';

/** One batched, cache-backed gateway for all finance reads. */
export class FinanceRepository {
  async readSnapshot() {
    const [loans, payments, history, settings] = await Promise.all([
      listRows(SHEETS.loans),
      listRows(SHEETS.payments),
      listRows(SHEETS.history),
      listRows(SHEETS.settings)
    ]);
    return { loans, payments, history, settings };
  }
}

export const financeRepository = new FinanceRepository();
