import { defineConfig } from 'tsdown/config'

export default defineConfig({
  dts: true,
  entry: 'src/index.ts',
  exports: true,
  copy: [
    '../../README.md',
  ],
  // minify: true,
})
