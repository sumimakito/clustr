import presetWebFonts from '@unocss/preset-web-fonts'
import { defineConfig, presetAttributify, presetIcons, presetMini } from 'unocss'

export default defineConfig({
  presets: [
    presetMini(),
    presetAttributify(),
    presetWebFonts({
      provider: 'fontsource',
      fonts: {
        mono: 'Fira Code',
      },
    }),
    presetIcons(),
  ],
})
