# Government Billing Solution MVP

A comprehensive Progressive Web Application (PWA) built with Ionic React and integrated with Starknet blockchain for government invoice billing. Features advanced offline capabilities, modern UI/UX, and cross-platform compatibility with blockchain-based file storage and token subscriptions.

## 🚀 Features

### Core Functionality
- **📊 Advanced Spreadsheet Engine**: Powered by SocialCalc for complex invoice calculations and data manipulation
- **🌐 Progressive Web App**: Full offline functionality with service workers and intelligent caching
- **📱 Cross-Platform Support**: Native experience on mobile (iOS/Android), tablet, and desktop
- **🔐 Blockchain Integration**: Starknet-powered file storage with IPFS and MED token subscriptions
- **💾 Smart Storage**: Client-side encryption with local storage and cloud sync capabilities
- **🖨️ Multi-format Export**: PDF, CSV export with signature support and batch processing

### Advanced Features
- **🔄 Offline-First Architecture**: Background sync with conflict resolution
- **🎨 Theming System**: Dark/light mode with customizable interface
- **📸 Camera Integration**: Document scanning and photo attachments
- **✍️ Digital Signatures**: Canvas-based signature capture and storage
- **🔔 Push Notifications**: Real-time updates and reminders
- **🏛️ Government-Ready**: Designed for public sector billing requirements

### Blockchain Features
- **💰 Token Subscriptions**: MED token-based subscription plans with different file limits
- **📂 IPFS Storage**: Decentralized file storage with blockchain verification
- **🔗 Wallet Integration**: Starknet wallet connectivity with ArgentX and Braavos support
- **📊 Usage Tracking**: On-chain subscription and file usage monitoring

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3.0 with TypeScript
- **Mobile Framework**: Ionic 8.0 with Capacitor 6.0
- **UI Components**: Ionic React components with custom theming
- **State Management**: React Context API (Theme, Invoice contexts)
- **Routing**: React Router 5.3.4
- **PWA**: Vite PWA plugin with Workbox

### Blockchain & Web3
- **Blockchain**: Starknet ecosystem
- **Wallet Integration**: @starknet-react/core 3.7.4
- **Smart Contracts**: Custom invoice and MED token contracts
- **Storage**: IPFS for decentralized file storage
- **Network**: Starknet mainnet/testnet support

### Development Tools
- **Build Tool**: Vite with TypeScript configuration
- **Package Manager**: npm with lock file
- **Linting**: ESLint with React plugin
- **Testing**: Vitest for unit tests, Cypress for e2e
- **Code Quality**: TypeScript strict mode disabled for flexibility

### Mobile/Desktop
- **iOS**: Native iOS app via Capacitor
- **Android**: Native Android app via Capacitor  
- **Desktop**: PWA installable on desktop platforms
- **Plugins**: Camera, Filesystem, Preferences, Share, Email Composer, Printer

### Services & Storage
- **Local Storage**: Capacitor Preferences with encryption
- **Cloud Services**: AWS SDK integration
- **File Processing**: jsPDF, html2canvas for document generation
- **Encryption**: crypto-js for client-side data protection

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Files/           # File management components
│   ├── Menu/            # Navigation and menu components
│   ├── socialcalc/      # Spreadsheet engine integration
│   ├── Storage/         # Local storage utilities
│   └── wallet/          # Blockchain wallet components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
│   ├── useContractRead.ts   # Blockchain read operations
│   ├── useContractWrite.ts  # Blockchain write operations
│   └── usePWA.ts           # PWA functionality
├── pages/               # Application pages/screens
├── services/            # Business logic and external services
├── utils/               # Utility functions and helpers
├── abis/                # Smart contract ABIs and constants
└── theme/               # CSS custom properties and theming
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)
- Starknet wallet (ArgentX or Braavos) for blockchain features

### Installation Steps
```bash
# Clone the repository
git clone https://github.com/anisharma07/cairo-invoice-frontend.git
cd cairo-invoice-frontend

# Install dependencies
npm install

# Install Ionic CLI globally (optional but recommended)
npm install -g @ionic/cli

# Install Capacitor CLI (for mobile development)
npm install -g @capacitor/cli
```

## 🎯 Usage

### Development
```bash
# Start development server with hot reload
npm run dev

# Start with Ionic CLI (alternative)
ionic serve

# The app will be available at http://localhost:5173
```

### Production
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Build and deploy with Docker
docker-compose up ionic-prod
```

### Mobile Development
```bash
# Build web assets first
npm run build

# Add mobile platforms
npx cap add ios
npx cap add android

# Sync web assets with mobile projects
npx cap sync

# Open in platform IDEs
npx cap open ios
npx cap open android

# Run on device
npx cap run ios
npx cap run android
```

### Docker Development
```bash
# Development environment (Alpine-based)
docker-compose --profile dev up

# Development environment (Full Node.js)
docker-compose --profile dev-full up

# Production environment
docker-compose up ionic-prod
```

## 📱 Platform Support

- **Web Browsers**: Chrome, Firefox, Safari, Edge (PWA installable)
- **Mobile**: iOS 11+, Android 5.0+ (API level 21+)
- **Desktop**: Windows, macOS, Linux (via PWA installation)
- **Offline Support**: Full functionality available offline with sync when online

## 🧪 Testing

```bash
# Run unit tests
npm run test.unit

# Run e2e tests
npm run test.e2e

# Run linting
npm run lint
```

## 🔄 Deployment

### Web Deployment
The application can be deployed to any static hosting service:

```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting service
```

### Docker Deployment
```bash
# Production deployment with Docker
docker-compose up ionic-prod

# With custom environment variables
docker-compose up ionic-prod --env-file .env.production
```

### Mobile App Store Deployment
```bash
# Build and sync for mobile
npm run build
npx cap sync

# Generate signed builds in respective IDEs
npx cap open ios    # For App Store
npx cap open android # For Google Play Store
```

## 📊 Performance & Optimization

### PWA Optimizations
- **Service Worker**: Automatic caching with Workbox
- **Background Sync**: Offline data synchronization
- **Image Optimization**: WebP support with fallbacks
- **Code Splitting**: Automatic route-based code splitting

### Blockchain Optimizations
- **Connection Pooling**: Efficient Starknet RPC connections
- **Caching**: Smart contract read result caching
- **Batching**: Transaction batching for multiple operations

### Mobile Optimizations
- **Lazy Loading**: Components and routes loaded on demand
- **Image Compression**: Automatic image optimization for mobile
- **Memory Management**: Efficient memory usage for large spreadsheets

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing TypeScript patterns and component structure
- Ensure all blockchain interactions include proper error handling
- Test PWA functionality across different browsers
- Maintain backward compatibility with existing invoice formats
- Update documentation for new features

### Code Style
- Use TypeScript for type safety
- Follow React hooks patterns for state management
- Implement proper error boundaries for blockchain operations
- Use Ionic components consistently for UI elements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SocialCalc**: For the powerful spreadsheet engine
- **Ionic Team**: For the excellent cross-platform framework
- **Starknet**: For blockchain infrastructure and developer tools
- **Open Source Community**: For the various libraries and tools that make this project possible

## 📞 Support & Contact

- **Issues**: Please open an issue on GitHub for bugs or feature requests
- **Documentation**: Additional documentation available in the `/docs` folder
- **Blockchain Integration**: See `IPFS_INTEGRATION.md` for detailed blockchain setup
- **Docker Setup**: See `DOCKER.md` for containerization details

### Getting Help
1. Check existing GitHub issues for common problems
2. Review the documentation in the `/docs` directory
3. Test wallet connectivity using the built-in debug page (`/wallet-test`)
4. Ensure proper Starknet network configuration for blockchain features

---

**Built with ❤️ for efficient government billing and blockchain innovation**