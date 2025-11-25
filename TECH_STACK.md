# ProGen AI - Technology Stack Documentation

## 🚀 Project Overview
**ProGen AI** is a modern, full-stack AI-powered prompt generation and image creation platform built with cutting-edge web technologies. The platform features a professional UI with neon effects, glassmorphism design, and seamless AI integrations.

---

## 📦 Frontend Technologies

### **Core Framework & Library**
- **React 19.2.0** - Modern UI library for building interactive user interfaces
- **React DOM 19.2.0** - React rendering library for web applications
- **React Router DOM 7.9.6** - Client-side routing for single-page applications

### **Build Tools & Development**
- **Vite 7.2.4** - Next-generation frontend build tool with HMR (Hot Module Replacement)
- **@vitejs/plugin-react 5.1.1** - Vite plugin for React support
- **ESLint 9.39.1** - Code linting and quality assurance
- **Concurrently 8.2.2** - Run multiple npm scripts simultaneously

### **Styling & UI**
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **@tailwindcss/vite 4.1.17** - Tailwind CSS plugin for Vite
- **PostCSS 8.5.6** - CSS transformation tool
- **Autoprefixer 10.4.22** - Automatic vendor prefixing for CSS

### **UI Components & Icons**
- **Lucide React 0.554.0** - Beautiful, customizable icon library
- **Framer Motion 12.23.24** - Production-ready motion library for React animations

### **State Management**
- **React Hooks** (useState, useEffect, useContext) - Built-in React state management
- **LocalStorage API** - Client-side data persistence

---

## 🤖 AI & Machine Learning APIs

### **Prompt Generation & Optimization**
- **Google Generative AI (Gemini) 0.24.1**
  - Model: `gemini-2.0-flash`
  - Purpose: Prompt optimization, refinement, and enhancement
  - Integration: `@google/generative-ai` package

### **Image Generation**
- **Stability AI API**
  - Model: Stable Diffusion XL 1024 v1.0
  - Endpoint: `/api/stability/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`
  - Features: High-quality image generation with customizable parameters
  - Configuration: API key required (configured in Settings)

---

## 🎤 Speech & Audio Technologies

### **Text-to-Speech (TTS)**
- **Browser Web Speech API** (`speechSynthesis`)
  - Built-in browser TTS (no API key required)
  - Multi-language support
  - Offline capability

- **ElevenLabs API** (Optional Cloud TTS)
  - High-quality, realistic voice synthesis
  - Custom voice ID support
  - Requires API key configuration

- **Google Text-to-Speech (gTTS)** (Backend - Optional)
  - Python library: `gTTS 2.2+`
  - Server-side TTS endpoint
  - Multi-language support

### **Speech Recognition**
- **Web Speech Recognition API** (`webkitSpeechRecognition` / `SpeechRecognition`)
  - Browser-based voice input
  - Real-time transcription
  - Multi-language support
  - Offline capability (browser-dependent)

---

## 🖥️ Backend Technologies

### **Server Framework**
- **Python 3.8+** - Backend programming language
- **Flask 2.0+** - Lightweight web framework
- **Flask-CORS 3.0+** - Cross-Origin Resource Sharing support

### **Backend Services**
- **gTTS (Google Text-to-Speech) 2.2+** - Python library for TTS
- **io** - Python standard library for in-memory file handling

---

## 🔧 Development Tools

### **Code Quality**
- **ESLint 9.39.1** - JavaScript/React linting
- **@eslint/js 9.39.1** - ESLint JavaScript configuration
- **eslint-plugin-react-hooks 7.0.1** - React Hooks linting rules
- **eslint-plugin-react-refresh 0.4.24** - React Fast Refresh linting

### **Type Definitions**
- **@types/react 19.2.5** - TypeScript definitions for React
- **@types/react-dom 19.2.3** - TypeScript definitions for React DOM

### **Utilities**
- **globals 16.5.0** - Global variables for ESLint

---

## 🌐 API Integrations & Proxies

### **Vite Development Server Proxies**
The project uses Vite's proxy configuration for seamless API integration:

1. **Stability AI Proxy**
   - Route: `/api/stability/*`
   - Target: `https://api.stability.ai`
   - Purpose: Image generation API

2. **Hugging Face Proxy** (Configured but not actively used)
   - Route: `/api/huggingface/*`
   - Target: `https://api-inference.huggingface.co`
   - Purpose: Alternative image generation models

3. **Local gTTS Server Proxy**
   - Route: `/api/gtts`
   - Target: `http://localhost:5000`
   - Purpose: Server-side text-to-speech (optional)

---

## 🎨 Design & UI Features

### **Design System**
- **Glassmorphism** - Frosted glass effect with backdrop blur
- **Neon UI** - Cyan (#00e5ff) and Pink (#ff32b8) color scheme
- **Dark/Light Theme** - Theme switching with Context API
- **Floating Animations** - CSS keyframe animations
- **Gradient Effects** - Multi-color gradients for buttons and accents

### **Responsive Design**
- Mobile-first approach
- Tailwind CSS responsive utilities
- Flexible layouts with Flexbox and Grid

---

## 💾 Data Persistence

### **Client-Side Storage**
- **LocalStorage API** - Browser-based storage for:
  - API keys (encrypted in memory)
  - User preferences (theme, language)
  - Saved prompts
  - Plugin configurations
  - Conversation history

---

## 🔐 Environment Variables

### **Required API Keys**
- `VITE_GEMINI_API_KEY` - Google Gemini API key for prompt optimization
- `VITE_STABILITY_API_KEY` - Stability AI API key for image generation
- `VITE_ELEVENLABS_API_KEY` - (Optional) ElevenLabs API key for cloud TTS

### **Configuration**
- Environment variables loaded via `import.meta.env`
- Secure storage in localStorage
- Settings modal for API key management

---

## 📁 Project Structure

```
progenai/
├── src/
│   ├── components/
│   │   ├── Generator.jsx      # Main prompt generation component
│   │   └── Navbar.jsx         # Navigation bar component
│   ├── contexts/
│   │   └── ThemeContext.jsx   # Theme management context
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global styles and theme
├── server/
│   ├── app.py                 # Flask backend server
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Server documentation
├── vite.config.js             # Vite configuration
├── package.json               # Node.js dependencies
└── TECH_STACK.md              # This file
```

---

## 🚀 Key Features & Technologies Used

### **1. Prompt Generation**
- **Technology**: Google Gemini 2.0 Flash
- **Features**: 
  - Simple, Detailed, Technical prompt styles
  - Multi-language support
  - Prompt refinement with AI-generated questions

### **2. Image Generation**
- **Technology**: Stability AI (Stable Diffusion XL)
- **Features**:
  - High-resolution image generation (1024x1024)
  - Customizable parameters (steps, CFG scale)
  - Base64 image encoding

### **3. Voice Input**
- **Technology**: Web Speech Recognition API
- **Features**:
  - Real-time voice transcription
  - Multi-language recognition
  - Visual feedback during listening

### **4. Text-to-Speech**
- **Technologies**: 
  - Browser Web Speech API (primary)
  - ElevenLabs API (optional, cloud)
  - gTTS server (optional, backend)
- **Features**:
  - Multiple voice options
  - Language-specific voices
  - Offline capability

### **5. UI/UX Features**
- **Animations**: Framer Motion for smooth transitions
- **Theme System**: Context API for light/dark mode
- **Glassmorphism**: CSS backdrop-filter effects
- **Neon Effects**: CSS gradients and shadows
- **Responsive Design**: Tailwind CSS breakpoints

---

## 🔄 Development Workflow

### **Frontend Development**
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### **Backend Development** (Optional)
```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
python app.py
```

### **Concurrent Development**
```bash
npm run dev:all      # Run both frontend and backend
```

---

## 📊 Technology Summary

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend Framework** | React | 19.2.0 | UI Library |
| **Build Tool** | Vite | 7.2.4 | Build & Dev Server |
| **Styling** | Tailwind CSS | 4.1.17 | CSS Framework |
| **Animations** | Framer Motion | 12.23.24 | Motion Library |
| **Icons** | Lucide React | 0.554.0 | Icon Library |
| **AI - Prompts** | Google Gemini | 2.0-flash | Prompt Generation |
| **AI - Images** | Stability AI | SDXL-1024 | Image Generation |
| **TTS - Browser** | Web Speech API | Native | Text-to-Speech |
| **TTS - Cloud** | ElevenLabs | API | Premium TTS |
| **Speech Recognition** | Web Speech API | Native | Voice Input |
| **Backend** | Flask | 2.0+ | Python Server |
| **Routing** | React Router | 7.9.6 | Client Routing |

---

## 🌟 Unique Features

1. **Dual Theme System** - Seamless light/dark mode switching
2. **Glassmorphism UI** - Modern frosted glass design
3. **Neon Aesthetics** - Vibrant cyan and pink color scheme
4. **Multi-Modal AI** - Text, image, and code generation
5. **Voice Integration** - Speech-to-text and text-to-speech
6. **Plugin System** - Extensible prompt enhancement system
7. **Conversation History** - Persistent chat history
8. **Prompt Refinement** - AI-powered prompt improvement suggestions
9. **Rating System** - User feedback for generated prompts
10. **Multi-Language Support** - English, Hindi, Tamil, Telugu

---

## 📝 Notes

- The project uses modern ES6+ JavaScript features
- All API keys are stored securely in localStorage
- The backend server is optional (most features work frontend-only)
- Browser compatibility: Modern browsers with Web Speech API support
- The project follows React best practices and hooks patterns

---

**Last Updated**: 2025
**Project Version**: 0.0.0 (Development)
**License**: Private

