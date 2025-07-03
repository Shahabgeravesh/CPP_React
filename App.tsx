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
  const [currentView, setCurrentView] = useState<"chapters" | "favorites" | "dashboard" | "settings">("chapters");
  const [flashcards, setFlashcards] = useState<Flashcard[]>(flashcardsData.flashcards || []);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState<"all" | "bookmarked" | "difficult">("all");
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [showChapterDetails, setShowChapterDetails] = useState(false);

  // Define the 6 main chapters from ASIS CPP exam
  const chapters = [
    {
      id: "security-principles-practices",
      title: "Security Principles and Practices (22%)",
      description: "Security management, leadership, and business principles",
      categories: ["Security Principles and Practices"],
      icon: "🛡️"
    },
    {
      id: "business-principles-practices",
      title: "Business Principles and Practices (15%)",
      description: "Business operations, financial management, and organizational strategy",
      categories: ["Asset Protection", "security Standards"],
      icon: "💼"
    },
    {
      id: "investigations",
      title: "Investigations (9%)",
      description: "Investigation techniques, procedures, and documentation",
      categories: ["Investigations"],
      icon: "🔍"
    },
    {
      id: "personnel-security",
      title: "Personnel Security (11%)",
      description: "Employee screening, background checks, and personnel protection",
      categories: ["Personnel Security"],
      icon: "👥"
    },
    {
      id: "physical-security",
      title: "Physical Security (16%)",
      description: "Physical protection systems, access control, and security technology",
      categories: ["Physical Security"],
      icon: "🏢"
    },
    {
      id: "crisis-management",
      title: "Crisis Management (13%)",
      description: "Emergency response, business continuity, and crisis communication",
      categories: ["Crisis Management"],
      icon: "🚨"
    }
  ];

  // Get flashcards for a specific chapter
  const getChapterCards = (chapterId: string) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) return [];
    return flashcards.filter(card => chapter.categories.includes(card.category));
  };

  // Filter flashcards based on study mode
  const getFilteredCards = () => {
    let cards = selectedChapter ? getChapterCards(selectedChapter) : flashcards;
    
    switch (studyMode) {
      case 'bookmarked':
        return cards.filter(card => card.isBookmarked);
      case 'difficult':
        return cards.filter(card => card.difficulty === 'hard');
      default:
        return cards;
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

      {/* Content Area */}
      <View style={styles.content}>
        {currentView === 'chapters' && (
          <View style={styles.chaptersView}>
            {!showChapterDetails ? (
              // Chapter List View
              <>
                <Text style={styles.sectionTitle}>Chapters</Text>
                <Text style={styles.sectionSubtitle}>Select a chapter to study</Text>
                
                <FlatList
                  data={chapters}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const chapterCards = getChapterCards(item.id);
                    const bookmarkedCount = chapterCards.filter(card => card.isBookmarked).length;
                    
                    return (
                      <TouchableOpacity 
                        style={styles.chapterCard}
                        onPress={() => {
                          setSelectedChapter(item.id);
                          setShowChapterDetails(true);
                          setCurrentCardIndex(0);
                          setShowAnswer(false);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                      >
                        <View style={styles.chapterHeader}>
                          <Text style={styles.chapterIcon}>{item.icon}</Text>
                          <View style={styles.chapterInfo}>
                            <Text style={styles.chapterTitle}>{item.title}</Text>
                            <Text style={styles.chapterDescription}>{item.description}</Text>
                          </View>
                        </View>
                        <View style={styles.chapterStats}>
                          <Text style={styles.chapterCardCount}>{chapterCards.length} cards</Text>
                          {bookmarkedCount > 0 && (
                            <Text style={styles.bookmarkedCount}>⭐ {bookmarkedCount} bookmarked</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </>
            ) : (
              // Chapter Detail View
              <>
                <View style={styles.chapterDetailHeader}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => {
                      setShowChapterDetails(false);
                      setSelectedChapter(null);
                      setCurrentCardIndex(0);
                      setShowAnswer(false);
                    }}
                  >
                    <Text style={styles.backButtonText}>← Back to Chapters</Text>
                  </TouchableOpacity>
                  <Text style={styles.chapterDetailTitle}>
                    {chapters.find(ch => ch.id === selectedChapter)?.title}
                  </Text>
                </View>

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
              </>
            )}
          </View>
        )}

        {currentView === 'favorites' && (
          <View style={styles.favoritesView}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            <Text style={styles.sectionSubtitle}>Your bookmarked cards</Text>
            
            {(() => {
              const bookmarkedCards = flashcards.filter(card => card.isBookmarked);
              return bookmarkedCards.length > 0 ? (
                <FlatList
                  data={bookmarkedCards}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.favoriteCard}>
                      <Text style={styles.favoriteQuestion}>{item.question}</Text>
                      <Text style={styles.favoriteAnswer}>{item.answer}</Text>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No bookmarked cards yet</Text>
                  <Text style={styles.emptyStateSubtext}>Bookmark cards while studying to see them here</Text>
                </View>
              );
            })()}
          </View>
        )}

        {currentView === 'dashboard' && (
          <View style={styles.dashboardView}>
            <Text style={styles.sectionTitle}>Dashboard</Text>
            
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

      {/* Bottom Navigation */}
      <Navigation currentView={currentView} onNavigate={setCurrentView} />
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
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 80, // Add padding for bottom navigation
  },
  chaptersView: {
    flex: 1,
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
  favoritesView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6c757d',
  },
  favoriteCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  favoriteAnswer: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  dashboardView: {
    flex: 1,
  },
  chapterCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chapterIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  chapterDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  chapterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterCardCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  bookmarkedCount: {
    fontSize: 12,
    color: '#6c757d',
  },
  chapterDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  chapterDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
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
