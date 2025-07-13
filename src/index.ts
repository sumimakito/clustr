/**
 * Safely read UTF-8 grapheme clusters from a byte stream.
 *
 * @param stream A readable stream of Uint8Array data presenting UTF-8 encoded text.
 * @param options
 * @param options.signal An optional AbortSignal to cancel the operation.
 * @returns An async iterable iterator of grapheme clusters presented as strings.
 */
export function readGraphemeClusters(stream: ReadableStream<Uint8Array>, options?: { signal?: AbortSignal }): AsyncIterableIterator<string> {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const reader = stream.getReader()
  const signal = options?.signal

  return (async function* () {
    let buf = ''

    while (true) {
      if (signal?.aborted) {
        reader.cancel()
        const e = new Error('Operation canceled')
        e.name = signal.reason
        throw e
      }

      const readPromise = reader.read()
      let result
      if (signal) {
        result = await Promise.race([
          readPromise,
          new Promise((_, reject) => {
            signal.addEventListener('abort', () => {
              const e = new Error('Operation canceled')
              e.name = signal.reason
              reject(e)
            }, { once: true })
          }),
        ])
      }
      else {
        result = await readPromise
      }

      const { done, value } = result as ReadableStreamReadResult<Uint8Array<ArrayBufferLike>>
      if (done) {
        // Note: `value` will be `undefined` here
        // Flush any remaining buffer
        const segments = [...segmenter.segment(buf)]
        // … and yield all segments because they are all complete
        for (const seg of segments) {
          yield seg.segment
        }
        return
      }

      buf += decoder.decode(value, { stream: true })
      const segments = [...segmenter.segment(buf)]
      if (segments.length > 1) {
        // The last segment could be incomplete. Let's skip it for now
        const last = segments.pop()!
        for (const seg of segments) {
          yield seg.segment
        }
        buf = buf.slice(last.index)
      }
    }
  })()
}
