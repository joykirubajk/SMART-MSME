import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import Scheme from '../models/scheme.js';

const schemes = [
  { id: 1, name: 'Open', business_category: 'any', rules: { min_age: 18 }, benefits: {}, beneficiary_categories: [] },
  { id: 2, name: 'Needs income', business_category: 'any', rules: { max_annual_income: 300000 }, benefits: {}, beneficiary_categories: [] },
  { id: 3, name: 'Seniors only', business_category: 'any', rules: { min_age: 60 }, benefits: {}, beneficiary_categories: [] },
];
const body = { age: 30, gender: 'male', business_category: 'manufacturing', investment: 100000, location: 'tamil_nadu', income: null };

let spy;
beforeEach(() => { spy = jest.spyOn(Scheme, 'findAll').mockResolvedValue(schemes); });
afterEach(() => spy.mockRestore());

describe('POST /api/schemes/recommend', () => {
  test('returns eligible then possibly eligible, hides not eligible, lists missing inputs', async () => {
    const res = await request(app).post('/api/schemes/recommend').send(body);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.eligible_count).toBe(1);
    expect(res.body.possible_count).toBe(1);
    expect(res.body.data.map((s) => [s.id, s.tier])).toEqual([[1, 'eligible'], [2, 'possibly_eligible']]);
    expect(res.body.data[1].eligibility.missingInputs).toEqual(['income']);
  });

  test('400 with field errors when required fields are missing', async () => {
    const res = await request(app).post('/api/schemes/recommend').send({ age: 30 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.map((e) => e.field)).toEqual(['gender', 'business_category', 'investment', 'location']);
    expect(spy).not.toHaveBeenCalled();
  });

  test('non-numeric age is treated as missing -> 400', async () => {
    const res = await request(app).post('/api/schemes/recommend').send({ ...body, age: 'abc' });
    expect(res.status).toBe(400);
  });

  test('DB failure -> generic 500 JSON', async () => {
    spy.mockRejectedValue(new Error('connection refused to 10.0.0.1'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).post('/api/schemes/recommend').send(body);
    log.mockRestore();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: 'Internal server error' });
  });
});
