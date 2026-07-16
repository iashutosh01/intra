/**
 * Canonical read model returned to every application consumer.
 * Financial values are deliberately not derived here; only
 * LoanCalculationEngine is allowed to construct this model.
 */
export class LoanSummary {
  constructor(values) {
    Object.assign(this, values);
  }

  static create(values) {
    return new LoanSummary(values);
  }
}
