import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  FlatList,
  TextInput,
  Dimensions,
  Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Navigation from "./components/Navigation";
import Settings from "./components/Settings";
const flashcardsData = require("./assets/flashcards.json");

// Types
interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  isBookmarked: boolean;
  lastReviewed?: Date;
  reviewCount: number;
}

interface StudySession {
  id: string;
  date: Date;
  cardsReviewed: number;
  correctAnswers: number;
  timeSpent: number;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "study" | "stats" | "settings">("home");
  const [flashcards, setFlashcards] = useState<Flashcard[]>(flashcardsData.flashcards || []);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState<"all" | "bookmarked" | "difficult">("all");
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);

  // Filter flashcards based on study mode
  const getFilteredCards = () => {
    switch (studyMode) {
      case 'bookmarked':
        return flashcards.filter(card => card.isBookmarked);
      case 'difficult':
        return flashcards.filter(card => card.difficulty === 'hard');
      default:
        return flashcards;
    }
  };

  // Reset card index when study mode changes
  useEffect(() => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
  }, [studyMode]);

  const resetData = async () => {
    try {
      await AsyncStorage.removeItem("flashcards");
      await AsyncStorage.removeItem("studySessions");
      setFlashcards([]);
      setStudySessions([]);
      loadData(); // This will reload the sample data
    } catch (error) {
      console.error("Error resetting data:", error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedCards = await AsyncStorage.getItem("flashcards");
      const savedSessions = await AsyncStorage.getItem("studySessions");
      
      if (savedCards) {
        setFlashcards(JSON.parse(savedCards));
      } else {
        // Load from the JSON file
        setFlashcards(flashcardsData.flashcards || []);
        // Save to AsyncStorage for future use
        await AsyncStorage.setItem("flashcards", JSON.stringify(flashcardsData.flashcards || []));
      }
      
      if (savedSessions) {
        setStudySessions(JSON.parse(savedSessions));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ASIS CPP Flashcards</Text>
        <Text style={styles.headerSubtitle}>Loaded: {flashcards.length} cards</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.navTabs}>
        <TouchableOpacity 
          style={[styles.navTab, currentView === 'home' && styles.activeTab]}
          onPress={() => setCurrentView('home')}
        >
          <Text style={[styles.navText, currentView === 'home' && styles.activeText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navTab, currentView === 'study' && styles.activeTab]}
          onPress={() => setCurrentView('study')}
        >
          <Text style={[styles.navText, currentView === 'study' && styles.activeText]}>Study</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navTab, currentView === 'stats' && styles.activeTab]}
          onPress={() => setCurrentView('stats')}
        >
          <Text style={[styles.navText, currentView === 'stats' && styles.activeText]}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navTab, currentView === 'settings' && styles.activeTab]}
          onPress={() => setCurrentView('settings')}
        >
          <Text style={[styles.navText, currentView === 'settings' && styles.activeText]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {currentView === 'home' && (
          <View style={styles.homeView}>
            <Text style={styles.sectionTitle}>Welcome to ASIS CPP Flashcards</Text>
            <Text style={styles.sectionSubtitle}>Master the Certified Protection Professional exam</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{flashcards.length}</Text>
                <Text style={styles.statLabel}>Total Cards</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{flashcards.filter(card => card.isBookmarked).length}</Text>
                <Text style={styles.statLabel}>Bookmarked</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{studySessions.length}</Text>
                <Text style={styles.statLabel}>Study Sessions</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setCurrentView('study')}
            >
              <Text style={styles.startButtonText}>Start Studying</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentView === 'study' && (
          <View style={styles.studyView}>
            {/* Study Mode Selector */}
            <View style={styles.studyModeSelector}>
              <TouchableOpacity 
                style={[styles.modeButton, studyMode === 'all' && styles.activeMode]}
                onPress={() => setStudyMode('all')}
              >
                <Text style={[styles.modeText, studyMode === 'all' && styles.activeModeText]}>All Cards</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, studyMode === 'bookmarked' && styles.activeMode]}
                onPress={() => setStudyMode('bookmarked')}
              >
                <Text style={[styles.modeText, studyMode === 'bookmarked' && styles.activeModeText]}>Bookmarked</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, studyMode === 'difficult' && styles.activeMode]}
                onPress={() => setStudyMode('difficult')}
              >
                <Text style={[styles.modeText, studyMode === 'difficult' && styles.activeModeText]}>Difficult</Text>
              </TouchableOpacity>
            </View>

            {/* Flashcard Display */}
            {(() => {
              const filteredCards = getFilteredCards();
              return filteredCards.length > 0 ? (
                <View style={styles.cardContainer}>
                  <View style={styles.card}>
                    <Text style={styles.cardQuestion}>
                      {filteredCards[currentCardIndex]?.question}
                    </Text>
                    
                    {showAnswer && (
                      <View style={styles.answerContainer}>
                        <Text style={styles.answerLabel}>Answer:</Text>
                        <Text style={styles.cardAnswer}>
                          {filteredCards[currentCardIndex]?.answer}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardActions}>
                      <TouchableOpacity 
                        style={styles.bookmarkButton}
                        onPress={() => {
                          const currentCard = filteredCards[currentCardIndex];
                          const cardIndexInFullArray = flashcards.findIndex(card => card.id === currentCard.id);
                          const updatedCards = [...flashcards];
                          updatedCards[cardIndexInFullArray].isBookmarked = !updatedCards[cardIndexInFullArray].isBookmarked;
                          setFlashcards(updatedCards);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={styles.bookmarkButtonText}>
                          {filteredCards[currentCardIndex]?.isBookmarked ? '★' : '☆'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.flipButton}
                        onPress={() => {
                          setShowAnswer(!showAnswer);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                      >
                        <Text style={styles.flipButtonText}>
                          {showAnswer ? 'Hide Answer' : 'Show Answer'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Navigation Controls */}
                  <View style={styles.navigationControls}>
                    <TouchableOpacity 
                      style={[styles.navButton, currentCardIndex === 0 && styles.disabledButton]}
                      onPress={() => {
                        if (currentCardIndex > 0) {
                          setCurrentCardIndex(currentCardIndex - 1);
                          setShowAnswer(false);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      disabled={currentCardIndex === 0}
                    >
                      <Text style={styles.navButtonText}>Previous</Text>
                    </TouchableOpacity>

                    <Text style={styles.cardCounter}>
                      {currentCardIndex + 1} / {filteredCards.length}
                    </Text>

                    <TouchableOpacity 
                      style={[styles.navButton, currentCardIndex === filteredCards.length - 1 && styles.disabledButton]}
                      onPress={() => {
                        if (currentCardIndex < filteredCards.length - 1) {
                          setCurrentCardIndex(currentCardIndex + 1);
                          setShowAnswer(false);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      disabled={currentCardIndex === filteredCards.length - 1}
                    >
                      <Text style={styles.navButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.cardContainer}>
                  <View style={styles.card}>
                    <Text style={styles.cardQuestion}>
                      No cards available in this mode
                    </Text>
                    <Text style={styles.cardAnswer}>
                      {studyMode === 'bookmarked' 
                        ? 'Bookmark some cards to study them here' 
                        : studyMode === 'difficult' 
                        ? 'No difficult cards available' 
                        : 'No cards available'}
                    </Text>
                  </View>
    </View>
  );
            })()}
          </View>
        )}

        {currentView === 'stats' && (
          <View style={styles.statsView}>
            <Text style={styles.sectionTitle}>Study Statistics</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Study Sessions</Text>
                <Text style={styles.statValue}>{studySessions.length}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Bookmarked Cards</Text>
                <Text style={styles.statValue}>{flashcards.filter(card => card.isBookmarked).length}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Cards</Text>
                <Text style={styles.statValue}>{flashcards.length}</Text>
              </View>
            </View>

            {studySessions.length > 0 && (
              <View style={styles.recentSessions}>
                <Text style={styles.sectionSubtitle}>Recent Sessions</Text>
                <FlatList
                  data={studySessions.slice(-5)}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.sessionItem}>
                      <Text style={styles.sessionDate}>
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.sessionStats}>
                        {item.cardsReviewed} cards • {item.correctAnswers} correct
                      </Text>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        )}

        {currentView === 'settings' && (
          <View style={styles.settingsView}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={resetData}
            >
              <Text style={styles.settingButtonText}>Reset All Data</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => {
                Alert.alert(
                  "About",
                  "ASIS CPP Flashcards\n\nMaster the Certified Protection Professional exam with comprehensive flashcards covering all exam domains.\n\nVersion 1.0"
                );
              }}
            >
              <Text style={styles.settingButtonText}>About</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    marginTop: 5,
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  navTab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  navText: {
    fontSize: 16,
    color: '#6c757d',
  },
  activeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  homeView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  statCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  studyView: {
    flex: 1,
  },
  studyModeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 5,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeMode: {
    backgroundColor: '#007AFF',
  },
  modeText: {
    fontSize: 14,
    color: '#6c757d',
  },
  activeModeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cardContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardQuestion: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    lineHeight: 24,
  },
  answerContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  cardAnswer: {
    fontSize: 16,
    lineHeight: 22,
    color: '#495057',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  bookmarkButton: {
    padding: 10,
  },
  bookmarkButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  flipButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  flipButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  navButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardCounter: {
    fontSize: 16,
    color: '#6c757d',
  },
  statsView: {
    flex: 1,
  },
  statsContainer: {
    marginBottom: 30,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  recentSessions: {
    flex: 1,
  },
  sessionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionStats: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
  },
  settingsView: {
    flex: 1,
  },
  settingButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  settingButtonText: {
    fontSize: 16,
    color: '#495057',
  },
});

export default App;
