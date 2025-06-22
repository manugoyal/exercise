# Exercise App - React Native Web

This app has been converted to use React Native Web for cross-platform compilation to both web and iOS targets.

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- For iOS development: Xcode and CocoaPods

### Installation

```bash
npm install
```

## Development

### Web Development

To start the development server for web:

```bash
npm start
```

This will start the React development server and open the app in your browser at `http://localhost:3000`.

### Building for Web

To create a production build for web:

```bash
npm run build
```

This creates an optimized build in the `build/` directory.

### iOS Development

For iOS development, you'll need to set up the iOS project:

1. Install CocoaPods dependencies:

```bash
cd ios && pod install
```

2. Open the Xcode project:

```bash
open ios/ExerciseApp.xcworkspace
```

3. Build and run in Xcode or use the React Native CLI:

```bash
npx react-native run-ios
```

## Project Structure

- `src/` - Main application source code
- `ios/` - iOS-specific native code and configuration
- `public/` - Static assets for web
- `build/` - Web build output (generated)

## Key Changes Made

1. **React Native Components**: All HTML elements have been replaced with React Native components:

   - `<div>` → `<View>`
   - `<button>` → `<TouchableOpacity>`
   - `<p>`, `<span>` → `<Text>`
   - `<dialog>` → `<Modal>`

2. **Styling**: CSS has been replaced with React Native StyleSheet:

   - CSS classes → StyleSheet objects
   - CSS properties → React Native style properties

3. **Platform Detection**: Web-specific APIs (like `window`, `navigator`) are conditionally used only when available.

4. **Build Configuration**:
   - Metro bundler for React Native
   - React Native Web for web compilation
   - Babel configuration for cross-platform support

## Notes

- The app uses React Native Web to automatically translate React Native components to web equivalents
- Web-specific features like wake lock and unhandled rejection handling are preserved
- The same codebase works for both web and iOS without platform-specific files
- All styling is done through React Native StyleSheet for consistency across platforms

## Troubleshooting

### Web Build Issues

- Make sure all React Native components are properly imported
- Check that no HTML elements are being used directly

### iOS Build Issues

- Ensure CocoaPods is installed and dependencies are up to date
- Check that Xcode is properly configured for React Native development
