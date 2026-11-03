// Fixed lists the admin chooses from.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tests = require('../src/data/tests.json');

// Built-in tests: the starting data for the tests table (migration 0003), and what is
// served until that migration runs. After that, tests are managed in the admin.
export const STATIC_TESTS = tests;

// Test categories: must match the test filters on the site (CATS in src/logic/01-data.js).
export const TEST_CATEGORIES = [
  { id: 'vitamins', label: 'Vitamins' },
  { id: 'hormones', label: 'Hormones' },
  { id: 'thyroid', label: 'Thyroid' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'women', label: "Women's Health" },
  { id: 'men', label: "Men's Health" },
  { id: 'heart', label: 'Heart' },
  { id: 'liver', label: 'Liver' },
  { id: 'kidney', label: 'Kidney' },
  { id: 'blood', label: 'Blood' },
  { id: 'bone', label: 'Bone' },
];

export const SAMPLES = ['Blood', 'Urine', 'Stool', 'Swab', 'Other'];

// Must match the profile filters on the site (PF in src/logic/01-data.js).
export const CATEGORIES = [
  { id: 'wellness', label: 'Wellness' },
  { id: 'vitamins', label: 'Vitamins' },
  { id: 'thyroid', label: 'Thyroid' },
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'diabetes', label: 'Diabetes' },
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
