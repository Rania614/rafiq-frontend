import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 1. بيجيب إعدادات Next.js الافتراضية
  ...compat.extends('next/core-web-vitals'),

  // 2. دمج إعدادات Prettier عشان تمنع أي تعارض وتظهر الأخطاء كلينتر
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // 3. بيقفل قواعد الـ ESLint اللي بتتعارض مع الـ Prettier
  prettierConfig,
];

export default eslintConfig;
