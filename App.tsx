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
  isFavorite: boolean;
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
  const [currentView, setCurrentView] = useState<"chapters" | "dashboard" | "settings">("chapters");
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
      icon: "shield"
    },
    {
      id: "business-principles-practices",
      title: "Business Principles and Practices (15%)",
      description: "Business operations, financial management, and organizational strategy",
      categories: ["Business Principles and Practices"],
      icon: "account-balance"
    },
    {
      id: "investigations",
      title: "Investigations (9%)",
      description: "Investigation techniques, procedures, and documentation",
      categories: ["Investigations"],
      icon: "find-in-page"
    },
    {
      id: "personnel-security",
      title: "Personnel Security (11%)",
      description: "Employee screening, background checks, and personnel protection",
      categories: ["Personnel Security"],
      icon: "verified-user"
    },
    {
      id: "physical-security",
      title: "Physical Security (16%)",
      description: "Physical protection systems, access control, and security technology",
      categories: ["Physical Security"],
      icon: "security"
    },
    {
      id: "crisis-management",
      title: "Crisis Management (13%)",
      description: "Emergency response, business continuity, and crisis communication",
      categories: ["Crisis Management"],
      icon: "emergency"
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
      // Clear all AsyncStorage data
      await AsyncStorage.removeItem("flashcards");
      await AsyncStorage.removeItem("studySessions");
      await AsyncStorage.removeItem("studyState");
      
      // Reset all state variables
      setFlashcards([]);
      setStudySessions([]);
      setSelectedChapter(null);
      setStudyMode('all');
      setShowChapterDetails(false);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      
      // Load fresh data from the JSON file with all cards reset to initial state
      const initialCards = (flashcardsData.flashcards || []).map((card: any) => ({
        ...card,
        isBookmarked: false,
        isMastered: false,
        nextReviewDate: undefined,
        masteryLevel: 0,
        lastReviewed: undefined,
        reviewCount: 0
      }));
      
      setFlashcards(initialCards);
      
      // Save the fresh data to AsyncStorage
      await AsyncStorage.setItem("flashcards", JSON.stringify(initialCards));
      
      // Show confirmation
      alert("Data Reset Complete\n\nAll study progress has been reset. You can now start fresh!");
    } catch (error) {
      console.error("Error resetting data:", error);
      alert("Reset Error\n\nThere was an error resetting the data. Please try again.");
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
          isFavorite: card.isFavorite || false,
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
          isFavorite: card.isFavorite || false,
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
                                <Icon name="bookmark" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                                <Text style={styles.bookmarkedCount}>{bookmarkedCount}</Text>
              </View>
                            )}
                            {chapterCards.filter(card => card.masteryLevel <= 1).length > 0 && (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="schedule" size={16} color="#64748b" style={{ marginRight: 4 }} />
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
                        style={styles.favoriteButton}
                        onPress={() => {
                          const currentCard = studyCards[currentCardIndex];
                          const cardIndexInFullArray = flashcards.findIndex(card => card.id === currentCard.id);
                          const updatedCards = [...flashcards];
                          // Toggle bookmark when favorite is pressed
                          updatedCards[cardIndexInFullArray].isBookmarked = !updatedCards[cardIndexInFullArray].isBookmarked;
                          // Also update favorite status to match bookmark status
                          updatedCards[cardIndexInFullArray].isFavorite = updatedCards[cardIndexInFullArray].isBookmarked;
                          setFlashcards(updatedCards);
                          AsyncStorage.setItem("flashcards", JSON.stringify(updatedCards));
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Icon 
                          name={studyCards[currentCardIndex]?.isBookmarked ? 'favorite' : 'favorite-border'} 
                          size={24} 
                          color={studyCards[currentCardIndex]?.isBookmarked ? "#e11d48" : "#6b7280"} 
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
                            <Icon name="thumb-down" size={20} color="white" style={{ marginRight: 8 }} />
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
                            <Icon name="thumb-up" size={20} color="white" style={{ marginRight: 8 }} />
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
                        {studyMode === 'all' && (
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
                        )}
                  </View>
    </View>
  );
            })()}
              </>
            )}
          </View>
        )}



        {currentView === 'dashboard' && (
          <ScrollView style={styles.dashboardScrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Dashboard</Text>
            
            {/* Overall Progress Summary */}
            <View style={[styles.dashboardStatsGrid, { marginBottom: 16 }]}>
              <View style={styles.dashboardStatCard}>
                <Text style={styles.dashboardStatNumber}>{flashcards.length}</Text>
                <Text style={styles.dashboardStatLabel}>Total Cards</Text>
              </View>
              <View style={styles.dashboardStatCard}>
                <Text style={styles.dashboardStatNumber}>{flashcards.filter(card => card.isMastered).length}</Text>
                <Text style={styles.dashboardStatLabel}>Mastered</Text>
              </View>
              <View style={styles.dashboardStatCard}>
                <Text style={styles.dashboardStatNumber}>{flashcards.filter(card => card.isBookmarked).length}</Text>
                <Text style={styles.dashboardStatLabel}>Bookmarked</Text>
              </View>
              <View style={styles.dashboardStatCard}>
                <Text style={styles.dashboardStatNumber}>{flashcards.filter(card => card.reviewCount > 0 && card.masteryLevel === 0).length}</Text>
                <Text style={styles.dashboardStatLabel}>Need Review</Text>
              </View>
            </View>

            {/* Chapter Progress (condensed) */}
            <View style={[styles.chapterProgressSection, { marginBottom: 16 }]}>
              <Text style={styles.sectionSubtitle}>Chapter Progress</Text>
              {chapters.map((chapter) => {
                const chapterCards = getChapterCards(chapter.id);
                const masteredCards = chapterCards.filter(card => card.isMastered).length;
                const totalCards = chapterCards.length;
                const progressPercentage = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;
                const needReviewCards = chapterCards.filter(card => card.reviewCount > 0 && card.masteryLevel === 0).length;
                
                return (
                  <View key={chapter.id} style={[styles.chapterProgressCard, { marginBottom: 10 }]}>
                    <View style={styles.chapterProgressHeader}>
                      <View style={styles.chapterProgressInfo}>
                        <Text style={styles.chapterProgressTitle}>{chapter.title}</Text>
                        <Text style={styles.chapterProgressSubtitle}>
                          {masteredCards}/{totalCards} mastered
                      </Text>
                      </View>
                      <View style={styles.chapterProgressStats}>
                        <Text style={styles.chapterProgressPercentage}>
                          {Math.round(progressPercentage)}%
                      </Text>
                    </View>
                    </View>
                    
                    <View style={styles.chapterProgressBar}>
                      <View 
                        style={[
                          styles.chapterProgressFill, 
                          { width: `${progressPercentage}%` }
                        ]} 
                />
              </View>
                    
                    <View style={styles.chapterProgressDetails}>
                      <View style={styles.chapterProgressDetail}>
                        <Text style={styles.chapterProgressDetailLabel}>Need Review:</Text>
                        <Text style={[styles.chapterProgressDetailValue, needReviewCards > 0 && styles.needReviewHighlight]}>
                          {needReviewCards}
                        </Text>
                      </View>
                      <View style={styles.chapterProgressDetail}>
                        <Text style={styles.chapterProgressDetailLabel}>Bookmarked:</Text>
                        <Text style={styles.chapterProgressDetailValue}>
                          {chapterCards.filter(card => card.isBookmarked).length}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              

          </View>
          </ScrollView>
        )}

        {currentView === 'settings' && (
          <View style={styles.settingsView}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => {
                if (confirm("This will erase all your progress, bookmarks, and study sessions. Are you sure you want to continue?")) {
                  resetData();
                }
              }}
            >
              <Text style={styles.settingButtonText}>Reset All Data</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => {
                alert(`🛡️ ASIS CPP Flashcards v1.0

🎯 Master the Certified Protection Professional (CPP) exam with comprehensive flashcards covering all exam domains.

📋 Study Content:
• Security Principles and Practices (22%)
• Business Principles and Practices (15%)
• Investigations (9%)
• Personnel Security (11%)
• Physical Security (16%)
• Crisis Management (13%)

⚡ Features:
• 629 comprehensive flashcards
• Spaced repetition learning
• Chapter-based organization
• Progress tracking dashboard
• Bookmark system
• Study session analytics
• Offline functionality

🏆 Exam Preparation:
The CPP certification is the gold standard for security management professionals. This app helps you master the core concepts through active recall and spaced repetition.

💻 Built with React Native & Expo

Good luck with your CPP exam! 🚀`);
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
    padding: 24,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'white',
    opacity: 0.95,
    marginTop: 8,
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 20,
    fontWeight: '400',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 20,
  },

  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 13,
    color: 'white',
    opacity: 0.9,
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: 80, // Add padding for bottom navigation
    backgroundColor: '#f8fafc',
  },
  chaptersView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
    lineHeight: 22,
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
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardQuestion: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    lineHeight: 28,
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  answerContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  answerLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  cardAnswer: {
    fontSize: 17,
    lineHeight: 26,
    color: '#374151',
    fontWeight: '400',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  favoriteButton: {
    padding: 10,
  },
  flipButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  flipButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  navButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardCounter: {
    fontSize: 16,
    color: '#6c757d',
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
  dashboardView: {
    flex: 1,
  },
  chapterCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  chapterDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '400',
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
    color: '#64748b',
    fontWeight: '500',
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
    backgroundColor: 'white',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  didntKnowButton: {
    backgroundColor: '#dc2626',
  },
  knewItButton: {
    backgroundColor: '#059669',
  },
  knowledgeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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

  dashboardScrollView: {
    flex: 1,
  },
  // Enhanced Dashboard Styles
  dashboardStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  dashboardStatCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    minWidth: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dashboardStatNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dashboardStatLabel: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  chapterProgressSection: {
    marginBottom: 30,
  },
  chapterProgressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chapterProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chapterProgressInfo: {
    flex: 1,
  },
  chapterProgressTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  chapterProgressSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  chapterProgressStats: {
    alignItems: 'flex-end',
  },
  chapterProgressPercentage: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: 0.5,
  },
  chapterProgressBar: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  chapterProgressFill: {
    height: '100%',
    backgroundColor: '#1e3a8a',
    borderRadius: 5,
  },
  chapterProgressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chapterProgressDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterProgressDetailLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginRight: 5,
  },
  chapterProgressDetailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
  },
  needReviewHighlight: {
    color: '#64748b',
    fontWeight: '600',
  },
  studyInsightsSection: {
    marginBottom: 30,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    minWidth: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 5,
    textAlign: 'center',
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  insightSubtext: {
    fontSize: 10,
    color: '#6c757d',
    textAlign: 'center',
  },
  recentActivitySection: {
    marginBottom: 30,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  activityDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  activityAccuracy: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityStats: {
    fontSize: 12,
    color: '#6c757d',
  },
  quickActionsSection: {
    marginBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default App;
