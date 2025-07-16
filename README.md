<div align="center">

# Clustr

Stream UTF-8 bytes and read grapheme clusters safely

[![Netlify Status](https://api.netlify.com/api/v1/badges/4a46ffaa-fe7e-4bd4-add7-9dc892370f1e/deploy-status)](https://app.netlify.com/projects/try-clustr/deploys) ![NPM Version](https://img.shields.io/npm/v/clustr?style=flat)

[Try Cluster](https://try-clustr.netlify.app/)

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

## Use case

Sometimes, you may want the message to be displayed in a stream-like manner with fancy animations in your chat bubble, like this:

![](docs/airi-chat-bubble.gif)

We built many UI components at [Project AIRI](https://github.com/moeru-ai/airi), where we use this library to safely split the elements to be animated in the chat bubble shown above. You should definitely check it out if you are also interested in meeting an AI soulmate.

## License

```
Copyright 2025 Makito

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
