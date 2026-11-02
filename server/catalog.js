// Fixed lists the admin chooses from. Tests come from the same file the
// website is built with, so ids always match.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tests = require('../src/data/tests.json');

export const TESTS = tests.map(({ id, name, params, mrp, fasting }) => ({ id, name, params, mrp, fasting }));
export const TEST_IDS = new Set(TESTS.map((t) => t.id));

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
