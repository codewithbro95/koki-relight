import { pipeline } from "@huggingface/transformers";

async function main() {
  try {
    const pipe = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf');
    console.log("Model loaded");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
