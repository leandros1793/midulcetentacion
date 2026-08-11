import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      // react-hooks v7 incluye reglas del React Compiler (muy agresivas).
      // Registramos el plugin pero solo activamos rules-of-hooks manualmente.
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Solo la regla esencial: hooks en componentes/hooks, nunca en loops/condicionales
      'react-hooks/rules-of-hooks': 'error',
      // Todas las demas reglas de v7 (React Compiler) desactivadas explicitamente
      'react-hooks/exhaustive-deps':               'off',
      'react-hooks/set-state-in-effect':           'off',
      'react-hooks/set-state-in-render':           'off',
      'react-hooks/purity':                        'off',
      'react-hooks/immutability':                  'off',
      'react-hooks/globals':                       'off',
      'react-hooks/refs':                          'off',
      'react-hooks/static-components':             'off',
      'react-hooks/use-memo':                      'off',
      'react-hooks/preserve-manual-memoization':   'off',
      'react-hooks/incompatible-library':          'off',
      'react-hooks/error-boundaries':              'off',
      'react-hooks/unsupported-syntax':            'off',
      'react-hooks/config':                        'off',
      'react-hooks/gating':                        'off',
      // react-refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
)
