import { getBenchmarks } from '@/lib/countries'
import { STATE_PROPERTY_TAX, isZip, zipToState } from '../../us'
import type { MortgageCountryConfig } from '../config'

const market = getBenchmarks('us')

/** United States mortgages. */
export const US_MORTGAGE: MortgageCountryConfig = {
  country: 'us',
  currency: 'USD',
  locale: 'en-US',
  programs: ['conventional', 'fha', 'va', 'usda'],

  // --- ESTIMATES: program rules -------------------------------------------------
  // Fees and premiums change over time and depend on the borrower. Verify every
  // number here against current FHA (HUD), VA and USDA sources before launch.
  program: {
    conventional: {
      minDown: 0.03,
      upfrontFee: [],
      // PMI under 20% down; lenders must drop it when the balance reaches 78% of the price.
      insurance: { kind: 'pmi', requiredAboveLtv: 0.8, removeAtLtv: 0.78 },
      rateSpread: 0,
      creditSensitivity: 1,
      dti: { front: 0.28, back: 0.36 },
    },
    fha: {
      minDown: 0.035,
      minDownByCredit: { '<580': 0.1 },
      // Upfront MIP.
      upfrontFee: [{ rate: 0.0175 }],
      // Annual MIP: lower on 15-year terms and at lower LTVs. For the life of the loan,
      // or 11 years with 10% or more down.
      insurance: {
        kind: 'premium',
        rows: [
          { maxTermMonths: 180, aboveLtv: 0.9, rate: 0.004 },
          { maxTermMonths: 180, rate: 0.0015 },
          { aboveLtv: 0.95, rate: 0.0055 },
          { rate: 0.005 },
        ],
        limitedWithDown: 0.1,
        years: 11,
      },
      rateSpread: -0.0025,
      creditSensitivity: 0.5,
      dti: { front: 0.31, back: 0.43 },
    },
    va: {
      minDown: 0,
      // Funding fee for first use, by down payment. (Later uses cost more with under 5% down.)
      upfrontFee: [
        { minDown: 0.1, rate: 0.0125 },
        { minDown: 0.05, rate: 0.015 },
        { rate: 0.0215 },
      ],
      insurance: { kind: 'none' },
      rateSpread: -0.00375,
      creditSensitivity: 0.5,
      dti: { front: null, back: 0.41 },
    },
    usda: {
      minDown: 0,
      // Upfront guarantee fee, then a small annual fee for the life of the loan.
      upfrontFee: [{ rate: 0.01 }],
      insurance: { kind: 'premium', rows: [{ rate: 0.0035 }] },
      rateSpread: -0.0025,
      creditSensitivity: 0.5,
      dti: { front: 0.29, back: 0.41 },
    },
  },

  // --- ESTIMATES: rates, PMI, tax and insurance -----------------------------------
  estimates: {
    // From the market benchmarks: 30 and 15 years quoted, 20 between them, 10 just under 15.
    rateByTermYears: {
      10: market.mortgage15Year - 0.001,
      15: market.mortgage15Year,
      20: (market.mortgage15Year + market.mortgage30Year) / 2,
      30: market.mortgage30Year,
    },
    rateByCredit: {
      '760+': -0.0025,
      '700-759': 0,
      '660-699': 0.00375,
      '620-659': 0.00875,
      '580-619': 0.0125,
      '<580': 0.0175,
    },
    pmiByCredit: {
      '760+': 0.003,
      '700-759': 0.005,
      '660-699': 0.008,
      '620-659': 0.011,
      '580-619': 0.0135,
      '<580': 0.015,
    },
    pmiUnknownCredit: 0.005,
    pmiLtvFactor: [
      { maxLtv: 0.85, factor: 0.45 },
      { maxLtv: 0.9, factor: 0.65 },
      { maxLtv: 0.95, factor: 0.85 },
      { maxLtv: Infinity, factor: 1 },
    ],
    propertyTaxNational: 0.009,
    propertyTaxByRegion: STATE_PROPERTY_TAX,
    insuranceRate: 0.005,
  },
  // ---------------------------------------------------------------------------------

  term: { minMonths: 12, maxMonths: 480, exampleMonths: 360 },
  creditBands: [
    { id: '760+', representativeScore: 780 },
    { id: '700-759', representativeScore: 730 },
    { id: '660-699', representativeScore: 680 },
    { id: '620-659', representativeScore: 640 },
    { id: '580-619', representativeScore: 600 },
    { id: '<580', representativeScore: 560 },
  ],
  regionOf: zipToState,
  isPostalCode: isZip,
}
