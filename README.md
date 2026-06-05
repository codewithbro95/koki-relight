# Koki Relight

AI-powered image relighting directly in your browser.

Upload a photo, place virtual lights, and instantly transform the lighting of your image without sending it to a server. Koki Relight uses depth estimation and real-time rendering to simulate professional lighting setups while keeping all processing local to your device.

## Features

* 📸 Upload JPG, JPEG, and PNG images
* 🧠 AI-powered depth estimation
* 💡 Interactive virtual light sources
* 🎨 Adjustable light color and intensity
* ⚡ Real-time relighting
* 🔒 Privacy-first, all processing runs locally
* 📤 Export relit images
* 📱 Responsive design for desktop and mobile

## How It Works

1. Upload an image.
2. Koki generates a depth map from the photo.
3. A normal map is derived from the depth information.
4. Virtual lights are applied using real-time rendering.
5. Adjust lighting until you achieve the desired look.
6. Export the final image.

## Tech Stack

* Next.js
* TypeScript
* Tailwind CSS
* Three.js
* React Three Fiber
* WebGPU
* ONNX Runtime Web
* Depth Anything V2

## Getting Started

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Production Build

```bash
npm start
```

## Project Structure

```text
src/
├── app/
├── components/
├── hooks/
├── lib/
├── shaders/
├── models/
└── utils/
```

## Privacy

Koki Relight is designed to run entirely in the browser. Images are processed locally and are not uploaded to any server.

## Roadmap

* Multiple light sources
* Preset lighting styles
* Advanced shadow simulation
* Text-prompt lighting controls
* Batch image processing
* High-resolution exports

## License

MIT License

---

Built with ❤️ for creators, designers, photographers, and developers.
