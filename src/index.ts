export function readGraphemeClusters(stream: ReadableStream<Uint8Array>, options?: { signal?: AbortSignal }) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const reader = stream.getReader()
  const signal = options?.signal

  async function* iterator() {
    let buf = ''

    while (true) {
      if (signal?.aborted) {
        reader.cancel()
        throw new Error('Aborted')
      }

      const readPromise = reader.read()
      let result
      if (signal) {
        result = await Promise.race([
          readPromise,
          new Promise((_, reject) => {
            signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })
          }),
        ])
      }
      else {
        result = await readPromise
      }

      const { done, value } = result as ReadableStreamReadResult<Uint8Array<ArrayBufferLike>>
      if (done) {
        const segments = [...segmenter.segment(buf)]
        for (const seg of segments) {
          yield seg.segment
        }
        break
      }

      buf += decoder.decode(value, { stream: true })

      const segments = [...segmenter.segment(buf)]
      if (segments.length > 1) {
        const last = segments.pop()!
        for (const seg of segments) {
          yield seg.segment
        }
        buf = buf.slice(last.index)
      }
    }
  }

  const asyncIterator = iterator()

  return {
    iterator: asyncIterator,
    [Symbol.asyncIterator]() { return asyncIterator },
  }
}
