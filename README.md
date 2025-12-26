# JournalLink MVP

A React Native app built with Expo that enables users to create personal journal entries and discover shared interests with others through proximity-based sync using Bluetooth Low Energy (BLE) or QR codes.

## Features

### ✅ Implemented (MVP)
- **Text Journal Entries**: Create and manage personal journal entries with tags
- **Encrypted Local Storage**: SQLite database with encryption for secure local data storage
- **AI Embeddings**: Stub implementation of text embeddings using a simple algorithm (ready for ONNX model integration)
- **BLE Proximity Sync**: Connect with nearby devices to exchange journal signatures
- **Insight Cards**: Discover shared tags and similarity scores with conversation starters
- **Dark Theme**: Beautiful dark mode interface with Deep Purple/Amber color scheme
- **Tag-based Filtering**: Filter journal entries by tags with an intuitive chip interface

### 🚧 Coming Soon
- **Image Support**: Add photos to journal entries with media extractor
- **Audio Notes**: Record and transcribe voice memos
- **Real AI Clustering**: Replace stub embeddings with actual ONNX model
- **Enhanced Sync Modes**: Friend mode and heart mode for different relationship types

## Tech Stack

- **Framework**: Expo SDK 52+ with React Native 0.79+
- **Language**: TypeScript
- **Navigation**: expo-router with tab-based architecture
- **State Management**: Zustand
- **Storage**: expo-sqlite with encryption + expo-filesystem for blobs
- **Bluetooth**: react-native-ble-plx for proximity sync
- **QR Codes**: expo-barcode-scanner for fallback sync
- **AI**: onnxruntime-react-native (stub implementation ready)
- **UI Framework**: react-native-paper with Material Design 3
- **Utilities**: date-fns, uuid, expo-secure-store

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd JournalLink
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on your preferred platform:
   - **iOS**: Press `i` to open iOS Simulator
   - **Android**: Press `a` to open Android Emulator  
   - **Web**: Press `w` to open in web browser
   - **Device**: Scan QR code with Expo Go app

## Development

### Project Structure
```
JournalLink/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home/Journal list
│   │   ├── newitem.tsx    # Create new entries
│   │   ├── sync.tsx       # BLE/QR sync interface
│   │   └── settings.tsx   # App settings
│   ├── item/[id].tsx      # Journal entry detail view
│   └── _layout.tsx        # Root layout with theming
├── lib/
│   ├── storage/           # Database and filesystem utilities
│   ├── sync/              # BLE and sync logic
│   ├── ai/                # Embedding pipeline (stub)
│   ├── store/             # Zustand state management
│   └── theme.ts           # Material Design 3 dark theme
├── components/            # Reusable UI components
├── utils/                 # Helper functions and constants
└── assets/               # Static assets and model files
```

### Database Schema
```sql
-- Journal entries with embeddings
CREATE TABLE journal_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'text', 'image', 'audio'
  raw_path TEXT,               -- File path for media
  clean_text TEXT NOT NULL,    -- Extracted/cleaned text
  tags TEXT NOT NULL,          -- JSON array of tags
  created_at INTEGER NOT NULL, -- Unix timestamp
  embedding BLOB               -- JSON array of floats
);

-- User preferences and metadata
CREATE TABLE user_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### Simulating BLE Sync in Development

Since BLE requires physical devices, the app includes simulation for development:

1. **Single Device Testing**: The BLE manager includes mock device discovery
2. **Two Device Simulation**: 
   - Run the app on two simulators/devices
   - Use "Start Hosting" on device A
   - Use "Scan for Devices" on device B
   - Mock signatures will be exchanged for testing

3. **QR Fallback**: Enable in Settings > QR Code Fallback for non-BLE testing

### Adding Real AI Models

The current implementation uses a stub embedding function. To integrate a real model:

1. **Replace the stub in `lib/ai/embeddings.ts`**:
```typescript
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

let session: InferenceSession | null = null;

export async function initializeModel() {
  session = await InferenceSession.create('./assets/model.onnx');
}

export async function embed(text: string): Promise<number[]> {
  if (!session) await initializeModel();
  
  // Tokenize and run inference
  const inputTensor = new Tensor('string', [text], [1]);
  const results = await session.run({ input: inputTensor });
  
  return Array.from(results.output.data as Float32Array);
}
```

2. **Add your ONNX model** to `assets/model.onnx`
3. **Update the embedding dimensions** in the database and comparison logic

### Sync Protocol

The sync process exchanges compressed signatures containing:
- **Device ID**: Unique identifier
- **Top Tags**: 10 most frequent tags
- **Average Embedding**: Mean of all entry embeddings (128-dim)
- **Timestamp**: When signature was created

Comparison generates:
- **Shared Tags**: Intersection of tag arrays
- **Similarity Score**: Cosine similarity of average embeddings (0-100%)
- **Questions**: Random selection of 3 conversation starters

## Deployment

### Building for Distribution

```bash
# Build for iOS
npx expo build:ios

# Build for Android  
npx expo build:android

# Build for web
npx expo export --platform web
```

### Environment Configuration

Create `.env.local` for development overrides:
```env
EXPO_PUBLIC_DEBUG_BLE=true
EXPO_PUBLIC_MOCK_SYNC=true
```

## Contributing

1. **Code Style**: Follow the existing TypeScript/React patterns
2. **State Management**: Use Zustand stores for shared state
3. **UI Components**: Prefer react-native-paper components
4. **Database**: Use the db helper functions, never direct SQL
5. **BLE Operations**: Always handle errors and permissions properly

## Roadmap

### Phase 2 (Post-MVP)
- [ ] Image capture and OCR text extraction
- [ ] Audio recording with speech-to-text
- [ ] Real ONNX model integration (MiniLM or similar)
- [ ] Advanced clustering algorithms
- [ ] Export/import functionality

### Phase 3 (Advanced Features)
- [ ] Friend connections and recurring sync
- [ ] Heart mode for romantic partners
- [ ] Cloud backup (optional, encrypted)
- [ ] Multi-language support
- [ ] Analytics and insights dashboard

## License

MIT License - see LICENSE file for details.

---

**Note**: This is an MVP implementation with stub AI components. The BLE sync is functional but simplified for demonstration. Production deployment would require proper model integration, enhanced security, and thorough testing on physical devices.