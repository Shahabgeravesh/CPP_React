# ASIS CPP Flashcards

A comprehensive mobile application designed to help security professionals prepare for the ASIS Certified Protection Professional (CPP) examination. The app features 629 carefully curated flashcards covering all 6 exam domains with an intuitive study interface.

## Features

### 📚 Comprehensive Study Material
- **629 Flashcards** covering all ASIS CPP exam domains
- **6 Chapters** organized by exam domains:
  - Chapter 1: Security Principles and Practices
  - Chapter 2: Business Principles and Practices
  - Chapter 3: Investigations
  - Chapter 4: Personnel Security
  - Chapter 5: Physical Security
  - Chapter 6: Information Security

### 🎯 Study Features
- **Smart Categorization**: Cards automatically categorized by relevance to each domain
- **Bookmark System**: Save important cards for quick access
- **Progress Tracking**: Monitor your study sessions and performance
- **Multiple Study Modes**: Choose your preferred learning approach

### 📱 Modern Interface
- **Bottom Navigation**: Easy access to all features
- **Responsive Design**: Optimized for all screen sizes
- **Dark Mode Support**: Comfortable viewing in any lighting
- **Haptic Feedback**: Enhanced user experience

## Screenshots

[Add screenshots here]

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/asis-cpp-flashcards.git
   cd asis-cpp-flashcards
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## Building for Production

### Android (Google Play Store)

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS Build**
   ```bash
   eas build:configure
   ```

4. **Build for production**
   ```bash
   eas build --platform android --profile production
   ```

5. **Submit to Google Play Store**
   ```bash
   eas submit --platform android
   ```

### iOS (App Store)

1. **Build for production**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

## Project Structure

```
asis-cpp-flashcards/
├── App.tsx                 # Main application component
├── components/             # Reusable UI components
│   ├── Navigation.tsx     # Bottom navigation component
│   └── Settings.tsx       # Settings screen component
├── assets/                # Static assets
│   ├── flashcards.json    # Flashcard data
│   ├── icon.png          # App icon
│   └── splash-icon.png   # Splash screen
├── app.json              # Expo configuration
├── eas.json              # EAS build configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and build tools
- **TypeScript**: Type-safe JavaScript
- **AsyncStorage**: Local data persistence
- **React Navigation**: Navigation between screens
- **Expo Linear Gradient**: Enhanced UI components

## Google Play Store Requirements

### ✅ Completed Requirements
- [x] Privacy Policy
- [x] Terms of Service
- [x] App metadata and descriptions
- [x] Proper app permissions
- [x] Content rating compliance
- [x] App signing configuration
- [x] Store listing assets

### 📋 Required Assets for Store Listing
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (minimum 2, maximum 8)
- Short description (80 characters max)
- Full description (4000 characters max)

## Development

### Adding New Flashcards
1. Edit `assets/flashcards.json`
2. Add new card with required fields:
   ```json
   {
     "id": "unique-id",
     "question": "Question text",
     "answer": "Answer text",
     "category": "chapter-id",
     "difficulty": "easy|medium|hard"
   }
   ```

### Styling Guidelines
- Use consistent color scheme: `#1e3a8a` (primary), `#3b82f6` (secondary)
- Maintain 16px border radius for cards
- Use proper shadows and elevation for depth
- Ensure accessibility with proper contrast ratios

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Email: support@asis-cpp-flashcards.com
- Website: https://asis-cpp-flashcards.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/asis-cpp-flashcards/issues)

## Acknowledgments

- ASIS International for the CPP certification program
- React Native and Expo communities
- Contributors and beta testers

---

**Note**: This app is not officially affiliated with ASIS International. It is an independent study tool created to help candidates prepare for the CPP examination. 