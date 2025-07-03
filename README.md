# ASIS CPP Flashcard App

A React Native flashcard application designed to help users prepare for the ASIS CPP (Certified Protection Professional) certification exam. This app provides an interactive learning experience with features like bookmarking, difficulty tracking, and study statistics.

## Features

### 🎯 Core Functionality
- **Interactive Flashcards**: Study ASIS CPP certification concepts with question-answer format
- **Multiple Study Modes**: 
  - All cards
  - Bookmarked cards only
  - Difficult cards only
- **Bookmarking System**: Mark important cards for quick access
- **Progress Tracking**: Monitor your study progress and statistics
- **Haptic Feedback**: Enhanced user experience with tactile feedback

### 📊 Statistics & Analytics
- Total cards count
- Bookmarked cards tracking
- Difficulty level distribution
- Category-based organization
- Study session history

### 🎨 User Interface
- Modern, clean design with gradient backgrounds
- Intuitive navigation between screens
- Responsive card layout
- Smooth animations and transitions
- Dark/light theme support

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd asis-cpp-flashcard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your preferred platform**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web
   npm run web
   ```

## Project Structure

```
asis-cpp-flashcard/
├── App.tsx                 # Main application component
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── assets/                # Images and static assets
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── README.md              # Project documentation
```

## Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **AsyncStorage**: Local data persistence
- **Expo Haptics**: Haptic feedback
- **Expo Linear Gradient**: Gradient backgrounds

## Data Structure

### Flashcard Interface
```typescript
interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isBookmarked: boolean;
  lastReviewed?: Date;
  reviewCount: number;
}
```

### Study Session Interface
```typescript
interface StudySession {
  id: string;
  date: Date;
  cardsReviewed: number;
  correctAnswers: number;
  timeSpent: number;
}
```

## Features in Detail

### Home Screen
- Overview statistics (total cards, bookmarked, difficult)
- Quick access to start studying
- Add new flashcards functionality

### Study Screen
- Interactive flashcard display
- Show/hide answer functionality
- Navigation between cards
- Bookmark toggle
- Study mode selection

### Statistics Screen
- Comprehensive study analytics
- Category breakdown
- Progress tracking

## Sample ASIS CPP Topics Covered

The app comes pre-loaded with comprehensive flashcards covering:

1. **Security Management**: Professional responsibilities and business alignment
2. **Business Principles**: Understanding organizational structure and management
3. **Financial Management**: Budgeting, financial statements, and ratios
4. **Risk Management**: ORMS, performance indicators, and systems approach
5. **Strategic Planning**: Long-term planning and organizational resilience

## Customization

### Adding New Flashcards
1. Tap "Add New Card" on the home screen
2. Enter the question
3. Enter the answer
4. The card will be automatically categorized as "Custom"

### Modifying Existing Cards
- Cards are stored locally using AsyncStorage
- Data persists between app sessions
- Easy to extend with additional features

## Development

### Available Scripts
- `npm start`: Start the Expo development server
- `npm run ios`: Run on iOS simulator
- `npm run android`: Run on Android emulator
- `npm run web`: Run in web browser

### Building for Production
```bash
# For iOS
expo build:ios

# For Android
expo build:android
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the original ASIS CPP Flashcard iOS app
- Built with React Native and Expo
- Designed for ASIS CPP certification preparation

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Happy Learning! 🚀** 