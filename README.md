# Koki Relight

A browser-based AI image relighting application that transforms image lighting using local AI-powered depth estimation and real-time 3D rendering.

Upload a photo, place virtual lights, and instantly transform the lighting of your image without sending it to a server. All processing happens locally in your browser, ensuring complete privacy while delivering professional-quality results.

## Features

* Upload JPG, JPEG, and PNG images
* AI-powered depth estimation (HuggingFace Transformers)
* Interactive virtual light sources with adjustable position, color, and intensity
* Preset lighting configurations (Studio, Cyberpunk, Sunset, Spotlight, Moonlight)
* Real-time light softness and radius adjustment
* Instant preview of relighting effects
* Privacy-first, all processing runs entirely locally
* Export relit images as PNG
* Ambient lighting control
* Responsive design for desktop and mobile
* Recenter and orbit camera controls

## How It Works

1. Upload an image to the application
2. AI model generates a depth map from the image using depth estimation
3. Normal map is derived from the depth information for realistic lighting
4. Place and configure virtual lights in 3D space
5. Real-time rendering applies lighting to the image based on depth
6. Adjust light properties (color, intensity, softness, radius) to achieve desired look
7. Export the final relit image

## Tech Stack

* **Build Tool**: Vite
* **UI Framework**: React 19
* **Language**: TypeScript
* **3D Rendering**: Three.js + React Three Fiber
* **AI Models**: HuggingFace Transformers (for depth estimation)
* **Styling**: Tailwind CSS 4
* **UI Components**: Lucide React
* **Animations**: Motion
* **Other**: Google Genai SDK

## Project Structure

```
src/
├── App.tsx                 # Main application component with light presets
├── components/
│   ├── ControlPanel.tsx   # Light adjustment controls
│   ├── RelightingScene.tsx # 3D scene rendering with Three.js
│   └── UploadArea.tsx      # Image upload interface
├── utils/
│   └── depth.ts           # Depth estimation and normal map generation
├── main.tsx               # React entry point
└── index.css              # Global styles
```

## Getting Started

### Prerequisites

* Node.js 18+
* npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite development server on `http://localhost:3000`

### Production Build

```bash
npm run build
```

Creates an optimized production build in the `dist/` directory.

### Preview Build

```bash
npm run preview
```

Serves the production build locally for testing.

### Linting

```bash
npm run lint
```

Checks TypeScript types for errors.

## License

This project is developed as part of the CodeWithBro tools collection.

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
