<script setup lang="ts">
import { animate } from 'animejs'
import { readGraphemeClusters } from 'clustr'
import { ref, shallowRef } from 'vue'

interface InputCluster {
  index: number
  text: string
  bytes: Uint8Array
}

const inputText = ref('🧑‍🧒🤾‍♀️🚵👨‍🚀👩‍🚀💇‍♀️🚵‍♂️🚵‍♀️👩‍👩‍👧‍👧') // cSpell:disable-line
const textBytes = ref<Uint8Array>()
const clusters = ref<string[]>([])
const inputClusters = ref<InputCluster[]>([])

const abortController = shallowRef<AbortController>()
const sendIndex = ref(-1)

function encodeText() {
  sendIndex.value = -1
  abortController.value?.abort()
  clusters.value = []
  textBytes.value = undefined
  inputClusters.value = []

  const bytes = new TextEncoder().encode(inputText.value)
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  inputClusters.value = [...segmenter.segment(inputText.value)].map<InputCluster>(segment => ({
    index: segment.index,
    text: segment.segment,
    bytes: new TextEncoder().encode(segment.segment),
  }))
  textBytes.value = bytes
}

async function stream() {
  abortController.value?.abort()
  const ac = new AbortController()
  abortController.value = ac
  clusters.value = []
  sendIndex.value = 0

  const iterator = readGraphemeClusters(
    new ReadableStream({
      async pull(controller) {
        if (!textBytes.value || sendIndex.value >= textBytes.value.length) {
          controller.close()
          return
        }

        await new Promise((resolve, reject) => {
          ac.signal?.addEventListener('abort', () => {
            reject(new Error('Operation canceled'))
          }, { once: true })

          setTimeout(resolve, 20)
        })

        if (ac.signal.aborted) {
          controller.close()
          return
        }
        controller.enqueue(new Uint8Array(textBytes.value.subarray(sendIndex.value, sendIndex.value + 1)))

        if (ac.signal.aborted) {
          controller.close()
          return
        }
        sendIndex.value++
      },
      cancel(controller) {
        controller.close()
      },
    }).getReader(),
    { signal: ac.signal },
  );

  (async () => {
    for await (const cluster of iterator) {
      clusters.value.push(cluster)
    }
  })()
}
</script>

<template>
  <div h-dvh w-dvw font-mono>
    <div h-full w-full flex flex-col justify-center p-16 gap-4 max-w-screen-xl mx-auto>
      <div flex="~ row items-end justify-between gap-4" pb-4>
        <div>
          <div text-xl>
            try
          </div>
          <div text-4xl>
            Clu<span font-bold>str</span>
          </div>
          <div>
            Stream UTF-8 bytes and read
            <a
              underline="~ black dotted" cursor-help
              href="https://unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries" target="_blank"
            >grapheme clusters</a>
            safely
          </div>
        </div>

        <div flex="~ row gap-2 items-center">
          <a href="https://www.npmjs.com/package/clustr" target="_blank">
            <div i-ri-npmjs-fill text-4xl op-50 transition-opacity hover:op-100 />
          </a>
          <a href="https://github.com/sumimakito/clustr" target="_blank">
            <div i-ri-github-fill text-4xl op-50 transition-opacity hover:op-100 />
          </a>
        </div>
      </div>

      <TransitionGroup
        tag="div"
        flex="~ col justify-center"
        min-h-0
        :css="false"
        @enter="(el, done) => {
          animate(el, {
            translateY: [-30, 0],
            opacity: [0, 1],
            easing: 'easeInOutSine',
            onComplete: done,
            duration: 300,
          })
        }"
        @leave=" (el, done) => {
          animate(el, {
            translateY: [0, 30],
            opacity: [1, 0],
            easing: 'easeInOutSine',
            onComplete: done,
            duration: 300,
          })
        }"
      >
        <div
          key="input"
          flex="~ col gap-4 items-start" w-full bg-light-50
          rounded-lg
          shadow="lg blue/10" p-4
          z-4
          b="~ blue-100 2"
        >
          <div font-bold>
            Input
          </div>

          <input
            v-model="inputText"
            autofocus
            name="input-text"
            b-none bg-transparent text-2xl outline-none
            w-full
            placeholder="Any text…"
            @keypress.enter="encodeText"
          >

          <div text-sm>
            Press Enter ↵ to encode
          </div>
        </div>

        <div
          v-if="textBytes && textBytes.length > 0" key="bytes"
          flex="~ col items-start gap-4"
          bg-light-100
          rounded="lb-lg rb-lg"
          shadow="lg blue/10"
          b="~ blue-100 2" px-4 pt-6 pb-4 mx-2 mt--2
          z-2
        >
          <div font-bold>
            Bytes
          </div>

          <div
            flex="~ row wrap gap-2 items-center"
            text-xl overflow-scroll w-full
          >
            <template v-for="(cluster) in inputClusters" :key="cluster.index">
              <div
                v-for="(byte, bi) in cluster.bytes"
                :key="bi"
                px-1 py-0.5 rounded-lg
                b="~ blue-100 2 dashed"
                :class="[{
                  'bg-blue-100': sendIndex >= cluster.index + bi,
                }]"
              >
                {{ byte.toString(16).toUpperCase().padStart(2, '0') }}
              </div>
              <span>{{ cluster.text }}</span>
              <span op-30><div i-ri-contract-left-line text-sm /></span>
            </template>
          </div>

          <div
            relative cursor-pointer
            transition rounded-full bg-blue-100 hover:bg-blue-200
            px-2 py-1
            @click="stream"
          >
            Stream
          </div>
        </div>

        <div
          v-if="clusters.length > 0"
          key="output"
          flex="~ col gap-2 items-start"
          bg-light-50
          rounded="lb-lg rb-lg"
          b="~ blue-100 2" px-4 pt-6 pb-4 mx-4 mt--2
          z-1
          shadow="lg blue/10"
        >
          <div font-bold>
            Output
          </div>

          <TransitionGroup
            :css="false"
            tag="div"
            flex="~ row gap-2 wrap"
            text-2xl
            @enter="(el, done) => {
              animate(el, {
                opacity: [0, 1],
                translateY: [30, 0],
                translateZ: 0,
                duration: 300,
                onComplete: done,
              })
            }"
            @leave="(el, done) => {
              animate(el, {
                opacity: 0,
                translateY: 30,
                translateZ: 0,
                duration: 300,
                onComplete: done,
              })
            }"
          >
            <div
              v-for="(cluster, index) in clusters"
              :key="index"
              bg-green-100 px-2 py-1 rounded-lg
            >
              {{ cluster }}
            </div>
          </TransitionGroup>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
