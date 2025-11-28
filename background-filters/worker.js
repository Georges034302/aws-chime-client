// Amazon Chime Background Filter Worker
importScripts('segmentation-simd.wasm', 'segmentation.wasm');

let processor;

onmessage = async (event) => {
  const { message, payload } = event.data;

  if (message === 'init') {
    processor = payload.processor;
  }

  if (message === 'process') {
    if (processor) {
      const output = await processor.process(payload);
      postMessage({ message: 'processed', payload: output }, [output]);
    }
  }
};
