import { pipeline, env, RawImage } from '@huggingface/transformers';

// Disable local models since we are running in browser via CDN
env.allowLocalModels = false;

export type DepthEstimationResult = {
  depthMapUrl: string;
  normalMapUrl: string;
};

function readDepthImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get 2d context from canvas");
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function generateNormalMap(depthImageData: ImageData, strength: number = 2.0): string {
  const width = depthImageData.width;
  const height = depthImageData.height;
  const depthData = depthImageData.data;
  
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const normalCtx = normalCanvas.getContext('2d')!;
  const normalImageData = normalCtx.createImageData(width, height);
  const normalData = normalImageData.data;

  // We'll read R channel as depth (since it's grayscale)
  function getDepth(x: number, y: number) {
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    const idx = (y * width + x) * 4;
    return depthData[idx] / 255.0; 
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dRight = getDepth(x + 1, y);
      const dLeft = getDepth(x - 1, y);
      const dTop = getDepth(x, y - 1);
      const dBottom = getDepth(x, y + 1);

      let nx = -(dRight - dLeft) * strength;
      let ny = -(dTop - dBottom) * strength;
      let nz = 1.0;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * width + x) * 4;
      normalData[idx]     = (nx * 0.5 + 0.5) * 255;
      normalData[idx + 1] = (ny * 0.5 + 0.5) * 255;
      normalData[idx + 2] = (nz * 0.5 + 0.5) * 255;
      normalData[idx + 3] = 255; // Alpha
    }
  }

  normalCtx.putImageData(normalImageData, 0, 0);
  return normalCanvas.toDataURL('image/png');
}

export class DepthPredictor {
  private static instance: DepthPredictor | null = null;
  private pipe: any = null;

  public static getInstance(): DepthPredictor {
    if (!DepthPredictor.instance) {
      DepthPredictor.instance = new DepthPredictor();
    }
    return DepthPredictor.instance;
  }

  async initialize(onProgress: (info: any) => void) {
    if (!this.pipe) {
      try {
        // First try webgpu with onnx-community/depth-anything-v2-small
        this.pipe = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', {
          device: 'webgpu',
          progress_callback: onProgress,
        });
      } catch (e) {
        console.warn('WebGPU failed or model unavailable, falling back to wasm', e);
        try {
          this.pipe = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
            device: 'wasm',
            progress_callback: onProgress,
          });
        } catch (e2) {
            console.warn('Fallback model failed, trying without specifying device', e2);
             this.pipe = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', {
                progress_callback: onProgress,
             });
        }
      }
    }
  }

  async predict(imageUrl: string, strength: number = 2.0): Promise<DepthEstimationResult> {
    if (!this.pipe) {
      throw new Error("Pipeline not initialized.");
    }

    const result = await this.pipe(imageUrl);
    
    // The result contains the depth map as a RawImage. We convert it to a canvas.
    const depthImage: RawImage = result.depth;
    
    // Provide an offscreen canvas implementation or standard canvas based on environment
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    
    if (typeof depthImage.toCanvas === 'function') {
      canvas = depthImage.toCanvas();
    } else {
        // Fallback manual conversion if toCanvas does not exist.
        canvas = document.createElement('canvas');
        canvas.width = depthImage.width;
        canvas.height = depthImage.height;
        const ctx = canvas.getContext('2d')!;
        const imgData = ctx.createImageData(depthImage.width, depthImage.height);
        for(let i=0; i<depthImage.data.length; i++) {
           imgData.data[i] = depthImage.data[i];
        }
        ctx.putImageData(imgData, 0, 0);
    }
    
    // cast to HTMLCanvasElement as it implements what we need
    const htmlCanvas = canvas as HTMLCanvasElement;
    const depthMapUrl = htmlCanvas.toDataURL ? htmlCanvas.toDataURL('image/png') : await rgbToDataUrl(depthImage);

    // Get ImageData from Canvas
    const ctx = htmlCanvas.getContext('2d');
    if (!ctx) throw new Error("Context 2d not supported");
    const imageData = ctx.getImageData(0, 0, htmlCanvas.width, htmlCanvas.height);
    
    // Generate Normal Map
    const normalMapUrl = generateNormalMap(imageData, strength);

    return {
      depthMapUrl,
      normalMapUrl,
    };
  }
}

// Fallback utility in case we need to convert RawImage manually to base64
async function rgbToDataUrl(image: RawImage) {
   const canvas = document.createElement('canvas');
   canvas.width = image.width;
   canvas.height = image.height;
   const ctx = canvas.getContext('2d')!;
   const imgData = ctx.createImageData(image.width, image.height);
   
   if (image.channels === 1) {
       for(let i=0; i<image.data.length; i++) {
           imgData.data[i*4] = image.data[i];
           imgData.data[i*4+1] = image.data[i];
           imgData.data[i*4+2] = image.data[i];
           imgData.data[i*4+3] = 255;
       }
   } else if (image.channels === 3) {
        for(let i=0; i<(image.data.length/3); i++) {
           imgData.data[i*4] = image.data[i*3];
           imgData.data[i*4+1] = image.data[i*3+1];
           imgData.data[i*4+2] = image.data[i*3+2];
           imgData.data[i*4+3] = 255;
       }
   }
   ctx.putImageData(imgData, 0, 0);
   return canvas.toDataURL('image/png');
}
