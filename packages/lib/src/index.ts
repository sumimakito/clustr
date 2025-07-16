export type MaybePromise<T> = T | Promise<T>

export type ReaderLikeReadResult = { done: false, value: Uint8Array } | { done: true, value?: Uint8Array }

export interface ReaderLike {
  read: () => MaybePromise<ReaderLikeReadResult>
  close?: () => void
}

export interface Options {
  signal?: AbortSignal
}

function throwIfAborted(signal?: AbortSignal, cleanup?: () => void) {
  if (signal?.aborted) {
    cleanup?.()
    const e = new Error('Operation canceled')
    e.name = signal?.reason
    throw e
  }
}

/**
 * Safely read UTF-8 grapheme clusters from a byte stream.
 *
 * @param reader
 * @param reader.read A function that read a chunk from a stream-like data source.
 * @param reader.close An optional function to close the reader.
 * @param options
 * @param options.signal An optional AbortSignal to cancel the operation.
 * @returns An async iterable iterator of grapheme clusters presented as strings.
 */
export function readGraphemeClusters(reader: ReaderLike, options?: Options): AsyncIterableIterator<string> {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  const decoder = new TextDecoder('utf-8', { fatal: false })

  const signal = options?.signal

  return (async function* () {
    let decodedText = ''

    while (true) {
      throwIfAborted(signal, reader.close)

      const { done, value } = await new Promise<ReaderLikeReadResult>((resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reader.close?.()
          const e = new Error('Operation canceled')
          e.name = signal.reason
          reject(e)
        }, { once: true })
        Promise.resolve(reader.read()).then(resolve).catch(reject)
      })

      decodedText += decoder.decode(value, { stream: true })
      const segments = segmenter.segment(decodedText)

      if (done) {
        for (const seg of segments) {
          throwIfAborted(signal, reader.close)

          yield seg.segment
        }
        return
      }

      const iter = segments[Symbol.iterator]()
      let lastIndex = 0
      let current = iter.next()

      while (!current.done) {
        throwIfAborted(signal, reader.close)

        const next = iter.next()
        if (next.done) {
          // Skip the last segment
          break
        }

        lastIndex = next.value.index
        yield current.value.segment
        current = next
      }

      if (!done) {
        decodedText = decodedText.slice(lastIndex)
      }
    }
  })()
}
