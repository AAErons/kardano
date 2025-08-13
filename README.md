# Kardano

A modern web application built with Vite, React, TypeScript, and Tailwind CSS.

## Features

- ⚡️ **Vite** - Fast build tool and dev server
- ⚛️ **React 18** - Modern React with hooks
- 🔷 **TypeScript** - Type-safe development
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📱 **Responsive Design** - Mobile-first approach
- 🚀 **Hot Module Replacement** - Instant updates during development

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
kardano/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles with Tailwind
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Technologies Used

- **Vite** - Next generation frontend tooling
- **React** - A JavaScript library for building user interfaces
- **TypeScript** - Typed superset of JavaScript
- **Tailwind CSS** - A utility-first CSS framework
- **PostCSS** - CSS post-processor
- **ESLint** - Code linting and formatting

## Customization

- Modify `tailwind.config.js` to customize Tailwind CSS
- Update `src/App.tsx` to change the main application
- Add new components in the `src/` directory
- Configure build options in `vite.config.ts`

## License

This project is open source and available under the [MIT License](LICENSE).
