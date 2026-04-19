import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

// Tree-shaking optimized configuration
export default [
  // Main bundle (full library)
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        exports: 'named'
      },
      {
        file: 'dist/index.esm.js',
        format: 'es'
      }
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src',
        exclude: ['dist/**']
      })
    ],
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'antd',
      '@emotion/react',
      '@emotion/styled'
    ]
  },
  
  // Modular bundle (tree-shaking optimized)
  {
    input: 'src/modular.ts',
    output: [
      {
        file: 'dist/modular.js',
        format: 'cjs',
        exports: 'named'
      },
      {
        file: 'dist/modular.esm.js',
        format: 'es'
      }
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/modular',
        rootDir: 'src',
        exclude: ['dist/**']
      })
    ],
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'antd',
      '@emotion/react',
      '@emotion/styled'
    ]
  },
  
  // Individual category bundles
  
  {
    input: 'src/categories/core.ts',
    output: [
      {
        file: 'dist/categories/core.js',
        format: 'cjs',
        exports: 'named'
      },
      {
        file: 'dist/categories/core.esm.js',
        format: 'es'
      }
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/categories',
        rootDir: 'src',
        exclude: ['dist/**']
      })
    ],
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'antd',
      '@emotion/react',
      '@emotion/styled'
    ]
  },
  {
    input: 'src/categories/animation.ts',
    output: [
      {
        file: 'dist/categories/animation.js',
        format: 'cjs',
        exports: 'named'
      },
      {
        file: 'dist/categories/animation.esm.js',
        format: 'es'
      }
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/categories',
        rootDir: 'src',
        exclude: ['dist/**']
      })
    ],
    external: ['react', 'react-dom', 'antd', '@emotion/react', '@emotion/styled']
  },
  {
    input: 'src/categories/feedback.ts',
    output: [
      {
        file: 'dist/categories/feedback.js',
        format: 'cjs',
        exports: 'named'
      },
      {
        file: 'dist/categories/feedback.esm.js',
        format: 'es'
      }
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/categories',
        rootDir: 'src',
        exclude: ['dist/**']
      })
    ],
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'antd',
      '@emotion/react',
      '@emotion/styled'
    ]
  },
  {
    input: 'src/categories/utilities.ts',
    output: [
      {
        file: 'dist/categories/utilities.js',
        format: 'cjs',
        exports: 'named'
      },
      {
        file: 'dist/categories/utilities.esm.js',
        format: 'es'
      }
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/categories',
        rootDir: 'src',
        exclude: ['dist/**']
      })
    ],
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'antd',
      '@emotion/react',
      '@emotion/styled'
    ]
  }
];