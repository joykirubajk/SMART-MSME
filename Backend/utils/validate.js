import { BUSINESS_CATEGORIES, GENDERS, SOCIAL_CATEGORIES, SPECIAL_CATEGORIES, EDUCATION_LEVELS } from './constants.js';

const absent = (v) => v === undefined || v === null || v === '';

const intRange = (min, max) => (raw) => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max
    ? { value: n }
    : { error: `must be a whole number between ${min} and ${max}` };
};

const money = (raw) => {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1e12 ? { value: n } : { error: 'must be a non-negative number' };
};

const oneOf = (list) => (raw) => {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return list.includes(v) ? { value: v } : { error: `must be one of: ${list.join(', ')}` };
};

const stateSlug = (raw) => {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
  return /^[a-z_]{2,50}$/.test(v) && v !== 'all_india' ? { value: v } : { error: 'must be a valid state name' };
};

const text = (max) => (raw) => {
  const v = typeof raw === 'string' ? raw.trim() : '';
  return v.length > 0 && v.length <= max ? { value: v } : { error: `must be text of at most ${max} characters` };
};

const bool = (raw) => {
  if (raw === true || raw === 'true') return { value: true };
  if (raw === false || raw === 'false') return { value: false };
  return { error: 'must be true or false' };
};

// field -> [isCore, checker]. Core fields are the five the eligibility engine needs.
const PROFILE_FIELDS = {
  age: [true, intRange(18, 100)],
  gender: [true, oneOf(GENDERS)],
  business_category: [true, oneOf(BUSINESS_CATEGORIES)],
  investment: [true, money],
  state: [true, stateSlug],
  social_category: [false, oneOf(SOCIAL_CATEGORIES)],
  special_category: [false, oneOf(SPECIAL_CATEGORIES)],
  annual_income: [false, money],
  education: [false, oneOf(EDUCATION_LEVELS)],
  experience_years: [false, intRange(0, 80)],
  is_new_enterprise: [false, bool],
  business_description: [false, text(1000)],
};

// Validates a business profile. Absent optional fields become null.
// Returns { value, errors:[{field,message}] }. Unknown fields are ignored.
export function validateProfile(input, { requireCore = true } = {}) {
  const src = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const value = {};
  const errors = [];

  for (const [field, [isCore, check]] of Object.entries(PROFILE_FIELDS)) {
    const raw = src[field];
    if (absent(raw)) {
      if (isCore && requireCore) errors.push({ field, message: `${field} is required` });
      value[field] = null;
    } else if (typeof raw === 'object') {
      errors.push({ field, message: 'is invalid' });
    } else {
      const r = check(raw);
      if (r.error) errors.push({ field, message: `${field} ${r.error}` });
      else value[field] = r.value;
    }
  }
  return { value, errors };
}
