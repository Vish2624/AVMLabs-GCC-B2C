// Fixed lists the admin chooses from.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tests = require('../src/data/tests.json');
const profiles = require('../src/data/profiles.json');

// Built-in tests: the starting data for the tests table (migration 0003), and what is
// served until that migration runs. After that, tests are managed in the admin.
export const STATIC_TESTS = tests;

// Built-in profiles and their shared panels (the B2C rates sheet): what migration 0006 puts in the
// database, and the starting data of the local dev server.
export const STATIC_PROFILES = profiles;

// Test categories: must match the test filters on the site (CATS in src/logic/01-data.js).
export const TEST_CATEGORIES = [
  { id: 'routine', label: 'Liver, Kidney & Routine' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'thyroid', label: 'Thyroid' },
  { id: 'vitamins', label: 'Vitamins & Minerals' },
  { id: 'heart', label: 'Heart & Lipids' },
  { id: 'hormones', label: 'Hormones' },
  { id: 'infections', label: 'Infections & Immunity' },
  { id: 'tumour', label: 'Tumour Markers' },
];

// Countries the site serves. Every test and profile has a price and report time for each
// (must match REGIONS in src/logic/03-region-pricing.js).
export const COUNTRIES = [
  { code: 'AE', name: 'UAE', currency: 'AED', decimals: 0 },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', decimals: 0 },
  { code: 'BH', name: 'Bahrain', currency: 'BHD', decimals: 2 },
];

export const SAMPLES = ['Blood', 'Urine', 'Stool', 'Swab', 'Other'];

// Must match the profile filters on the site (PF in src/logic/01-data.js).
export const CATEGORIES = [
  { id: 'wellness', label: 'Wellness' },
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'heart', label: 'Heart' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'thyroid', label: 'Thyroid' },
  { id: 'vitamins', label: 'Vitamins' },
  { id: 'hair', label: 'Hair fall' },
  { id: 'organs', label: 'Kidney & Liver' },
  { id: 'kids', label: 'Kids' },
  { id: 'screening', label: 'Screening' },
];

// Lucide icon names (https://lucide.dev).
export const ICONS = [
  'layers',
  'shield-plus',
  'pill',
  'zap',
  'flower-2',
  'flower',
  'biceps-flexed',
  'syringe',
  'activity',
  'heart-pulse',
  'droplet',
  'bone',
  'atom',
  'sparkles',
  'heart',
  'scan-heart',
  'brain',
  'eye',
  'ear',
  'baby',
  'person-standing',
  'users',
  'stethoscope',
  'microscope',
  'test-tube',
  'test-tube-diagonal',
  'flask-conical',
  'dna',
  'tablets',
  'thermometer',
  'bandage',
  'scale',
  'weight',
  'dumbbell',
  'apple',
  'salad',
  'leaf',
  'sun',
  'moon',
  'ribbon',
  'hand-heart',
  'shield-check',
  'candy-off',
  'cigarette-off',
  'wine-off',
];

export const COLOURS = [
  { hue: 275, label: 'Violet' },
  { hue: 245, label: 'Indigo' },
  { hue: 195, label: 'Teal' },
  { hue: 150, label: 'Green' },
  { hue: 75, label: 'Amber' },
  { hue: 25, label: 'Orange' },
  { hue: 345, label: 'Rose' },
  { hue: 320, label: 'Pink' },
];
