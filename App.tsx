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
import Icon from "react-native-vector-icons/MaterialIcons";
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
  isMastered: boolean;
  nextReviewDate?: Date;
  masteryLevel: number; // 0 = never seen, 1-5 = learning levels
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
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);

  // Define the 6 main chapters from ASIS CPP exam
  const chapters = [
    {
      id: "security-principles-practices",
      title: "Security Principles and Practices (22%)",
      description: "Security management, leadership, and business principles",
      categories: ["Security Principles and Practices"],
      icon: "security"
    },
    {
      id: "business-principles-practices",
      title: "Business Principles and Practices (15%)",
      description: "Business operations, financial management, and organizational strategy",
      categories: ["Business Principles and Practices"],
      icon: "business"
    },
    {
      id: "investigations",
      title: "Investigations (9%)",
      description: "Investigation techniques, procedures, and documentation",
      categories: ["Investigations"],
      icon: "search"
    },
    {
      id: "personnel-security",
      title: "Personnel Security (11%)",
      description: "Employee screening, background checks, and personnel protection",
      categories: ["Personnel Security"],
      icon: "people"
    },
    {
      id: "physical-security",
      title: "Physical Security (16%)",
      description: "Physical protection systems, access control, and security technology",
      categories: ["Physical Security"],
      icon: "location-on"
    },
    {
      id: "crisis-management",
      title: "Crisis Management (13%)",
      description: "Emergency response, business continuity, and crisis communication",
      categories: ["Crisis Management"],
      icon: "warning"
    }
  ];

  // Get flashcards for a specific chapter
  const getChapterCards = (chapterId: string) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) return [];
    return flashcards.filter(card => chapter.categories.includes(card.category));
  };

  // Spaced repetition logic
  const getNextReviewDate = (masteryLevel: number): Date => {
    const now = new Date();
    const intervals = [1, 3, 7, 14, 30, 90]; // Days between reviews
    const daysToAdd = masteryLevel < intervals.length ? intervals[masteryLevel] : intervals[intervals.length - 1];
    return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  };

  const markCardAsKnown = (cardId: string) => {
    const updatedCards = flashcards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          masteryLevel: 3, // Mark as mastered (level 3)
          nextReviewDate: undefined, // No more reviews needed
          lastReviewed: new Date(),
          reviewCount: card.reviewCount + 1,
          isMastered: true // Mark as mastered
        };
      }
      return card;
    });
    setFlashcards(updatedCards);
    AsyncStorage.setItem("flashcards", JSON.stringify(updatedCards));
    
    // Update study session
    updateStudySession(cardId, true);
  };

  // Update study session with card review
  const updateStudySession = (cardId: string, wasCorrect: boolean) => {
    const today = new Date().toDateString();
    const existingSession = studySessions.find(session => 
      new Date(session.date).toDateString() === today
    );

    if (existingSession) {
      // Update existing session
      const updatedSessions = studySessions.map(session => {
        if (new Date(session.date).toDateString() === today) {
          return {
            ...session,
            cardsReviewed: session.cardsReviewed + 1,
            correctAnswers: session.correctAnswers + (wasCorrect ? 1 : 0)
          };
        }
        return session;
      });
      setStudySessions(updatedSessions);
      AsyncStorage.setItem("studySessions", JSON.stringify(updatedSessions));
    } else {
      // Create new session
      const newSession: StudySession = {
        id: Date.now().toString(),
        date: new Date(),
        cardsReviewed: 1,
        correctAnswers: wasCorrect ? 1 : 0,
        timeSpent: 0
      };
      const updatedSessions = [...studySessions, newSession];
      setStudySessions(updatedSessions);
      AsyncStorage.setItem("studySessions", JSON.stringify(updatedSessions));
    }
  };

  const markCardAsUnknown = (cardId: string) => {
    const updatedCards = flashcards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          masteryLevel: 0, // Keep at low mastery level (needs review)
          nextReviewDate: new Date(), // Review immediately
          lastReviewed: new Date(),
          reviewCount: card.reviewCount + 1,
          isMastered: false // Ensure it's not marked as mastered
        };
      }
      return card;
    });
    setFlashcards(updatedCards);
    AsyncStorage.setItem("flashcards", JSON.stringify(updatedCards));
    
    // Update study session
    updateStudySession(cardId, false);
  };

  // Get cards ready for review (spaced repetition)
  const getCardsForReview = () => {
    const now = new Date();
    let cards = selectedChapter ? getChapterCards(selectedChapter) : flashcards;
    
    // Filter based on study mode
    switch (studyMode) {
      case 'bookmarked':
        cards = cards.filter(card => card.isBookmarked && !card.isMastered);
        break;
      case 'difficult':
        // Show cards that user has marked as "didn't know" (reviewed at least once and mastery level 0)
        cards = cards.filter(card => card.reviewCount > 0 && card.masteryLevel === 0 && !card.isMastered);
        break;
      default:
        // For "All Cards" mode, show all non-mastered cards
        cards = cards.filter(card => !card.isMastered);
        break;
    }

    // For "All Cards" mode, return all non-mastered cards (no date filtering)
    if (studyMode === 'all') {
      return cards;
    }

    // For other modes, return cards that are ready for review (not mastered and due for review)
    return cards.filter(card => 
      !card.isMastered && 
      (!card.nextReviewDate || card.nextReviewDate <= now)
    );
  };

  // Get filtered cards (for fallback when no review cards available)
  const getFilteredCards = () => {
    let cards = selectedChapter ? getChapterCards(selectedChapter) : flashcards;
    
    switch (studyMode) {
      case 'bookmarked':
        return cards.filter(card => card.isBookmarked && !card.isMastered);
      case 'difficult':
        // Show cards that user has marked as "didn't know" (reviewed at least once and mastery level 0)
        return cards.filter(card => card.reviewCount > 0 && card.masteryLevel === 0 && !card.isMastered);
      default:
        // For "All Cards" mode, show all non-mastered cards
        return cards.filter(card => !card.isMastered);
    }
  };

  // Initialize study cards when entering chapter details
  useEffect(() => {
    if (showChapterDetails) {
      const reviewCards = getCardsForReview();
      if (reviewCards.length === 0) {
        // If no cards are due for review, show all cards
        const allCards = getFilteredCards();
        setStudyCards(allCards);
      } else {
        setStudyCards(reviewCards);
      }
      setCurrentCardIndex(0);
      setShowAnswer(false);
    }
  }, [showChapterDetails, selectedChapter, studyMode]);

  // Reset card index when study mode changes
  useEffect(() => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
  }, [studyMode]);

  const resetData = async () => {
    try {
      await AsyncStorage.removeItem("flashcards");
      await AsyncStorage.removeItem("studySessions");
      await AsyncStorage.removeItem("studyState");
      setFlashcards([]);
      setStudySessions([]);
      setSelectedChapter(null);
      setStudyMode('all');
      setShowChapterDetails(false);
      setCurrentCardIndex(0);
      loadData(); // This will reload the sample data
    } catch (error) {
      console.error("Error resetting data:", error);
    }
  };

  // Save current study state
  const saveStudyState = async () => {
    try {
      const studyState = {
        selectedChapter,
        studyMode,
        showChapterDetails,
        currentCardIndex
      };
      await AsyncStorage.setItem("studyState", JSON.stringify(studyState));
    } catch (error) {
      console.error("Error saving study state:", error);
    }
  };

  // Load study state
  const loadStudyState = async () => {
    try {
      const savedState = await AsyncStorage.getItem("studyState");
      if (savedState) {
        const state = JSON.parse(savedState);
        setSelectedChapter(state.selectedChapter);
        setStudyMode(state.studyMode || 'all');
        setShowChapterDetails(state.showChapterDetails || false);
        setCurrentCardIndex(state.currentCardIndex || 0);
      }
    } catch (error) {
      console.error("Error loading study state:", error);
    }
  };

  // Save study state when it changes
  useEffect(() => {
    saveStudyState();
  }, [selectedChapter, studyMode, showChapterDetails, currentCardIndex]);

  // Load initial data
  useEffect(() => {
    loadData();
    loadStudyState();
  }, []);

  const loadData = async () => {
    try {
      const savedCards = await AsyncStorage.getItem("flashcards");
      const savedSessions = await AsyncStorage.getItem("studySessions");
      
      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);
        // Initialize spaced repetition fields for existing cards
        const updatedCards = parsedCards.map((card: any) => ({
          ...card,
          isMastered: card.isMastered || false,
          nextReviewDate: card.nextReviewDate ? new Date(card.nextReviewDate) : undefined,
          masteryLevel: card.masteryLevel || 0,
          lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined
        }));
        setFlashcards(updatedCards);
      } else {
        // Load from the JSON file and initialize spaced repetition fields
        const initialCards = (flashcardsData.flashcards || []).map((card: any) => ({
          ...card,
          isMastered: false,
          nextReviewDate: undefined,
          masteryLevel: 0,
          lastReviewed: undefined
        }));
        setFlashcards(initialCards);
        // Save to AsyncStorage for future use
        await AsyncStorage.setItem("flashcards", JSON.stringify(initialCards));
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
      <StatusBar style="light" backgroundColor="#1e3a8a" />
      {/* Header */}
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>ASIS CPP Flashcards</Text>
        <Text style={styles.headerSubtitle}>Master the Certified Protection Professional Exam</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{flashcards.length}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{flashcards.filter(card => card.isBookmarked).length}</Text>
            <Text style={styles.statLabel}>Bookmarked</Text>
          </View>
        </View>
      </LinearGradient>

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
                          <Icon 
                            name={item.icon} 
                            size={32} 
                            color="#1e3a8a" 
                            style={styles.chapterIcon}
                          />
                          <View style={styles.chapterInfo}>
                            <Text style={styles.chapterTitle}>{item.title}</Text>
                            <Text style={styles.chapterDescription}>{item.description}</Text>
                          </View>
                        </View>
                        <View style={styles.chapterStats}>
                          <Text style={styles.chapterCardCount}>{chapterCards.length} cards</Text>
                          <View style={styles.chapterStatsRow}>
                            {bookmarkedCount > 0 && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                <Icon name="favorite" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                                <Text style={styles.bookmarkedCount}>{bookmarkedCount}</Text>
                              </View>
                            )}
                            {chapterCards.filter(card => card.masteryLevel <= 1).length > 0 && (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="warning" size={16} color="#dc3545" style={{ marginRight: 4 }} />
                                <Text style={styles.needReviewCount}>
                                  {chapterCards.filter(card => card.masteryLevel <= 1).length} need review
                                </Text>
                              </View>
                            )}
                          </View>
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
                    <Text style={[styles.modeText, studyMode === 'difficult' && styles.activeModeText]}>Need Review</Text>
                  </TouchableOpacity>
                </View>

                {/* Flashcard Display */}
                {(() => {
                  return studyCards.length > 0 ? (
                    <View style={styles.cardContainer}>
                      <ScrollView 
                        style={styles.cardScrollView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.cardScrollContent}
                      >
                        <View style={styles.card}>
                          <Text style={styles.cardQuestion}>
                            {studyCards[currentCardIndex]?.question}
                          </Text>
                          
                          {showAnswer && (
                            <View style={styles.answerContainer}>
                              <Text style={styles.answerLabel}>Answer:</Text>
                              <Text style={styles.cardAnswer}>
                                {studyCards[currentCardIndex]?.answer}
                              </Text>
                            </View>
                          )}

                          <View style={styles.cardActions}>
                            <TouchableOpacity 
                              style={styles.bookmarkButton}
                              onPress={() => {
                                const currentCard = studyCards[currentCardIndex];
                                const cardIndexInFullArray = flashcards.findIndex(card => card.id === currentCard.id);
                                const updatedCards = [...flashcards];
                                updatedCards[cardIndexInFullArray].isBookmarked = !updatedCards[cardIndexInFullArray].isBookmarked;
                                setFlashcards(updatedCards);
                                AsyncStorage.setItem("flashcards", JSON.stringify(updatedCards));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }}
                            >
                              <Icon 
                                name={studyCards[currentCardIndex]?.isBookmarked ? 'favorite' : 'favorite-border'} 
                                size={24} 
                                color="#007AFF" 
                              />
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
                      </ScrollView>

                      {/* Spaced Repetition Controls */}
                      {showAnswer && (
                        <View style={styles.spacedRepetitionControls}>
                          <TouchableOpacity 
                            style={[styles.knowledgeButton, styles.didntKnowButton]}
                            onPress={() => {
                              const currentCard = studyCards[currentCardIndex];
                              markCardAsUnknown(currentCard.id);
                              
                              // Move to next card or shuffle
                              if (currentCardIndex < studyCards.length - 1) {
                                setCurrentCardIndex(currentCardIndex + 1);
                              } else {
                                // Shuffle remaining cards and start over
                                const remainingCards = studyCards.filter((_, index) => index !== currentCardIndex);
                                if (remainingCards.length > 0) {
                                  const shuffled = remainingCards.sort(() => Math.random() - 0.5);
                                  setStudyCards([...shuffled, currentCard]);
                                  setCurrentCardIndex(0);
                                }
                              }
                              setShowAnswer(false);
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }}
                          >
                            <Icon name="close" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.knowledgeButtonText}>I Didn't Know</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={[styles.knowledgeButton, styles.knewItButton]}
                            onPress={() => {
                              const currentCard = studyCards[currentCardIndex];
                              markCardAsKnown(currentCard.id);
                              
                              // Remove card from study session and move to next
                              const updatedStudyCards = studyCards.filter((_, index) => index !== currentCardIndex);
                              if (updatedStudyCards.length > 0) {
                                setStudyCards(updatedStudyCards);
                                setCurrentCardIndex(Math.min(currentCardIndex, updatedStudyCards.length - 1));
                              } else {
                                // All cards mastered for this session
                                setStudyCards([]);
                                setCurrentCardIndex(0);
                              }
                              setShowAnswer(false);
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }}
                          >
                            <Icon name="check" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.knowledgeButtonText}>I Knew It</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Progress Indicator */}
                      <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>
                          {studyCards.length} cards remaining
                        </Text>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${((studyCards.length - currentCardIndex - 1) / studyCards.length) * 100}%` }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.cardContainer}>
                      <View style={styles.card}>
                        <Text style={styles.cardQuestion}>
                          🎉 Great job!
                        </Text>
                        <Text style={styles.cardAnswer}>
                          {studyMode === 'bookmarked' 
                            ? 'You\'ve reviewed all your bookmarked cards!' 
                            : studyMode === 'difficult' 
                            ? 'Great job! You\'ve reviewed all cards that need attention!' 
                            : 'Congratulations! You\'ve mastered all cards in this chapter!'}
                        </Text>
                        <TouchableOpacity 
                          style={styles.restartButton}
                          onPress={() => {
                            const reviewCards = getCardsForReview();
                            if (reviewCards.length > 0) {
                              setStudyCards(reviewCards);
                              setCurrentCardIndex(0);
                              setShowAnswer(false);
                            }
                          }}
                        >
                          <Text style={styles.restartButtonText}>Start New Session</Text>
                        </TouchableOpacity>
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
                <ScrollView 
                  style={styles.favoritesScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {bookmarkedCards.map((item) => (
                    <View key={item.id} style={styles.favoriteCard}>
                      <Text style={styles.favoriteQuestion}>{item.question}</Text>
                      <Text style={styles.favoriteAnswer}>{item.answer}</Text>
                    </View>
                  ))}
                </ScrollView>
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
          <ScrollView style={styles.dashboardScrollView} showsVerticalScrollIndicator={false}>
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
                {studySessions.slice(-5).map((item, index) => (
                  <View key={index} style={styles.sessionItem}>
                    <Text style={styles.sessionDate}>
                      {new Date(item.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.sessionStats}>
                      {item.cardsReviewed} cards • {item.correctAnswers} correct
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
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
    opacity: 0.9,
    marginTop: 5,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
  chapterStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  needReviewCount: {
    fontSize: 12,
    color: '#dc3545',
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
  // Spaced Repetition Styles
  spacedRepetitionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  knowledgeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  didntKnowButton: {
    backgroundColor: '#dc3545',
  },
  knewItButton: {
    backgroundColor: '#28a745',
  },
  knowledgeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  restartButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 20,
    alignSelf: 'center',
  },
  restartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Scrollable Content Styles
  cardScrollView: {
    flex: 1,
    maxHeight: 400,
  },
  cardScrollContent: {
    flexGrow: 1,
  },
  favoritesScrollView: {
    flex: 1,
  },
  dashboardScrollView: {
    flex: 1,
  },
});

export default App;
