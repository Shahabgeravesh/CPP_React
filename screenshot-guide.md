# Google Play Store Screenshots Guide for ASIS CPP Flashcards

## Required Screenshots (Minimum 2, Maximum 8)

### 1. **Main Chapters Screen** (Essential)
- **What to capture**: Home screen showing all 6 CPP exam chapters
- **Key features to highlight**: 
  - Clean chapter list with icons
  - Progress indicators (bookmarked cards, cards needing review)
  - Professional blue gradient header
- **Why important**: Shows the main navigation and content organization

### 2. **Flashcard Study Screen** (Essential)
- **What to capture**: Active flashcard with question visible
- **Key features to highlight**:
  - Clean card design with question text
  - "Show Answer" button
  - Bookmark/favorite button
  - Progress indicator
- **Why important**: Core functionality of the app

### 3. **Answer Revealed Screen** (Recommended)
- **What to capture**: Same flashcard with answer visible and spaced repetition buttons
- **Key features to highlight**:
  - "I Knew It" and "I Didn't Know" buttons
  - Answer text clearly displayed
  - Spaced repetition learning system
- **Why important**: Shows the intelligent learning algorithm

### 4. **Dashboard/Progress Screen** (Recommended)
- **What to capture**: Dashboard with statistics
- **Key features to highlight**:
  - Total cards count
  - Mastered cards count
  - Bookmarked cards count
  - Cards needing review
- **Why important**: Shows progress tracking capabilities

### 5. **Chapter Detail View** (Optional)
- **What to capture**: Specific chapter with study mode selector
- **Key features to highlight**:
  - Study mode buttons (All Cards, Bookmarked, Need Review)
  - Chapter-specific card count
  - Back navigation
- **Why important**: Shows organized study options

### 6. **Settings Screen** (Optional)
- **What to capture**: Settings page with options
- **Key features to highlight**:
  - Haptic feedback toggle
  - Dark mode toggle
  - Data management options
- **Why important**: Shows app customization features

## Screenshot Specifications

### Technical Requirements:
- **Resolution**: 1080 x 1920 pixels (minimum)
- **Format**: PNG or JPEG
- **File size**: Maximum 8MB per screenshot
- **Aspect ratio**: 9:16 (portrait)

### Content Requirements:
- **No device frames**: Screenshots should be clean without phone/tablet frames
- **No text overlays**: Avoid adding promotional text on screenshots
- **High quality**: Ensure text is readable and UI elements are clear
- **Consistent lighting**: Use the same brightness/contrast across all screenshots

## How to Capture Screenshots

### Option 1: Using Expo Development Build
1. Run `npx eas build --platform android --profile development`
2. Install the APK on your device
3. Navigate to each screen and take screenshots
4. Use device's built-in screenshot function

### Option 2: Using Android Emulator
1. Start Android Studio and create an AVD
2. Run `npm start` and press 'a' to open in Android emulator
3. Navigate through the app and take screenshots
4. Screenshots are saved in the emulator's gallery

### Option 3: Using Physical Device with Expo Go
1. Install Expo Go app on your Android device
2. Run `npm start` and scan the QR code
3. Navigate through the app and take screenshots
4. Transfer screenshots to your computer

## Recommended Screenshot Order for Play Store

1. **Main Chapters Screen** - First impression
2. **Flashcard Study Screen** - Core functionality
3. **Answer Revealed Screen** - Learning features
4. **Dashboard Screen** - Progress tracking
5. **Chapter Detail Screen** - Organization features
6. **Settings Screen** - Customization options

## Tips for Better Screenshots

1. **Use realistic data**: Make sure some cards are bookmarked and have progress
2. **Show variety**: Include different chapters and question types
3. **Highlight key features**: Ensure important buttons and features are visible
4. **Maintain consistency**: Use the same device orientation and zoom level
5. **Test readability**: Ensure all text is clearly visible and readable

## File Naming Convention

Use this naming convention for your screenshots:
- `screenshot-1-chapters.png`
- `screenshot-2-flashcard-study.png`
- `screenshot-3-answer-revealed.png`
- `screenshot-4-dashboard.png`
- `screenshot-5-chapter-detail.png`
- `screenshot-6-settings.png`

## Next Steps

1. **Capture screenshots** following this guide
2. **Review and edit** screenshots for quality
3. **Resize if needed** to meet 1080x1920 requirements
4. **Upload to Google Play Console** when publishing
5. **Test on different devices** to ensure they look good

## Additional Assets Needed

Besides screenshots, you'll also need:
- **App icon**: 512x512 pixels (already configured in app.json)
- **Feature graphic**: 1024x500 pixels (optional but recommended)
- **App description**: Compelling text describing your app
- **Keywords**: Relevant search terms for discoverability 