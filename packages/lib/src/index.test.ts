import { expect, it } from 'vitest'

import { readGraphemeClusters } from '.'

function createStream(text: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const bytes = new TextEncoder().encode(text)
      for (const byte of bytes) {
        controller.enqueue(new Uint8Array([byte]))
      }
      controller.close()
    },
  })
}

it('handles simple ascii text', async () => {
  const stream = createStream('Hello, world!')
  const reader = stream.getReader()
  const iterator = readGraphemeClusters(reader)

  const expectedClusters = ['H', 'e', 'l', 'l', 'o', ',', ' ', 'w', 'o', 'r', 'l', 'd', '!']
  let i = 0
  for await (const cluster of iterator) {
    expect(cluster).toBe(expectedClusters[i++])
  }
  expect(i).toBe(expectedClusters.length)
})

it('handles emoji grapheme clusters', async () => {
  const stream = createStream('👩‍👩‍👦‍👦0️⃣1️⃣2️⃣3️⃣4️⃣👨‍🚀👩‍🚀')
  const reader = stream.getReader()
  const iterator = readGraphemeClusters(reader)

  const expectedClusters = [
    '👩‍👩‍👦‍👦',
    '0️⃣',
    '1️⃣',
    '2️⃣',
    '3️⃣',
    '4️⃣',
    '👨‍🚀',
    '👩‍🚀',
  ]
  let i = 0
  for await (const cluster of iterator) {
    expect(cluster).toBe(expectedClusters[i++])
  }
  expect(i).toBe(expectedClusters.length)
})

it('handles complex emoji with modifiers', async () => {
  const stream = createStream('👨🏻‍👩🏻‍👧🏻‍👦🏻0️⃣1️⃣2️⃣3️⃣4️⃣👨‍🚀👩‍🚀')
  const reader = stream.getReader()
  const iterator = readGraphemeClusters(reader)

  const expectedClusters = [
    '👨🏻‍👩🏻‍👧🏻‍👦🏻',
    '0️⃣',
    '1️⃣',
    '2️⃣',
    '3️⃣',
    '4️⃣',
    '👨‍🚀',
    '👩‍🚀',
  ]
  let i = 0
  for await (const cluster of iterator) {
    expect(cluster).toBe(expectedClusters[i++])
  }
  expect(i).toBe(expectedClusters.length)
})

it('handles language-specific clusters', async () => {
  // Source: https://unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries
  const stream = createStream('g̈நிกำषिक्षि') // cSpell:disable-line
  const reader = stream.getReader()
  const iterator = readGraphemeClusters(reader)

  const expectedClusters = ['g̈', 'நி', 'กำ', 'षि', 'क्षि'] // cSpell:disable-line
  let i = 0
  for await (const cluster of iterator) {
    expect(cluster).toBe(expectedClusters[i++])
  }
  expect(i).toBe(expectedClusters.length)
})

it('aborts the operation', async () => {
  const controller = new AbortController()
  const stream = createStream('Hello, world!')
  const reader = stream.getReader()
  const iterator = readGraphemeClusters(reader, { signal: controller.signal })

  const expectedClusters = ['H', 'e', 'l']
  let i = 0
  try {
    for await (const cluster of iterator) {
      expect(cluster).toBe(expectedClusters[i++])
      if (i === 3) {
        controller.abort()
      }
    }
  }
  catch (error) {
    expect(error).toBeInstanceOf(Error)
  }
  expect(i).toBe(3)
})
