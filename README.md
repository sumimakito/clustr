<div align="center">

# Clustr

Stream UTF-8 bytes and read grapheme clusters safely

</div>

In UTF-8, a grapheme cluster is a sequence of one or more code points that can be rendered as a single character. For example, the Emoji ZWJ Sequences:

```
[...'👨‍🚀']
→ (3) ['👨', '‍', '🚀']
[...'👩‍👩‍👧‍👧']
→ (7) ['👩', '‍', '👩', '‍', '👧', '‍', '👧']
```

Of course, it's not as easy as splitting by ZWJ characters. In complex scripts like Indic languages, where a single character can also be represented by multiple code points:

```
[...'क्षि']
→ (4) ['क', '्', 'ष', 'ि']
```

You may learn more about grapheme clusters in [*Unicode® Standard Annex #29: Unicode Text Segmentation*](https://unicode.org/reports/tr29/).

Besides the built-in Intl.Segmenter API, there are a few libraries that can correctly split grapheme clusters from a string, but few of them accept byte streams directly.

Clustr aims to help you iterate grapheme clusters from a stream of UTF-8 bytes, making it easy to read them correctly, safely, and as early as possible.

## Installation

```bash
# if PNPM
pnpm add clustr

# else if NPM
npm install clustr

# else if Yarn
yarn add clustr
```

## Usage

```ts
import { readGraphemeClusters } from 'clustr'

function createStream(text: string) {
  const bytes = new TextEncoder().encode(text)
  let pullIndex = 0

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pullIndex < bytes.length) {
        controller.enqueue(new Uint8Array([bytes[pullIndex++]!]))
      }
      else {
        controller.close()
      }
    },
  })
}

const stream = createStream('👨‍🚀👩‍🚀💇‍♀️🚵‍♂️🚵‍♀️👩‍👩‍👧‍👧')
const reader = stream.getReader()

for await (const cluster of readGraphemeClusters(reader)) {
  console.log(cluster)
}
```
