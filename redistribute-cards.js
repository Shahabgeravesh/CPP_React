const fs = require('fs');

// Read the current flashcards
const flashcardsData = require('./assets/flashcards.json');

console.log('Total flashcards:', flashcardsData.flashcards.length);

// Target distribution based on ASIS CPP exam structure
// We have 629 cards total, so we need to scale the distribution
const originalTargetDistribution = {
  'Security Principles and Practices': 177,  // Chapter 1
  'Business Principles and Practices': 275,  // Chapter 2
  'Investigations': 309,                    // Chapter 3
  'Personnel Security': 202,                // Chapter 4
  'Physical Security': 168,                 // Chapter 5
  'Crisis Management': 48                   // Chapter 6
};

// Calculate the scaling factor to fit 629 cards
const totalOriginalTarget = Object.values(originalTargetDistribution).reduce((sum, count) => sum + count, 0);
const scalingFactor = 629 / totalOriginalTarget;

// Scale the distribution to fit our 629 cards
const targetDistribution = {};
Object.keys(originalTargetDistribution).forEach(chapter => {
  targetDistribution[chapter] = Math.round(originalTargetDistribution[chapter] * scalingFactor);
});

// Adjust to ensure we have exactly 629 cards
const currentTotal = Object.values(targetDistribution).reduce((sum, count) => sum + count, 0);
const difference = 629 - currentTotal;

if (difference !== 0) {
  // Add or subtract from the largest chapter
  const largestChapter = Object.keys(targetDistribution).reduce((largest, chapter) => 
    targetDistribution[chapter] > targetDistribution[largest] ? chapter : largest
  );
  targetDistribution[largestChapter] += difference;
}

// Total should be 629
const totalTarget = Object.values(targetDistribution).reduce((sum, count) => sum + count, 0);
console.log('Target total:', totalTarget);

// First, let's analyze the current content to understand what we have
const currentCategories = [...new Set(flashcardsData.flashcards.map(card => card.category))];
console.log('\nCurrent categories:');
currentCategories.forEach(cat => {
  const count = flashcardsData.flashcards.filter(card => card.category === cat).length;
  console.log(`- ${cat}: ${count} cards`);
});

// Chapter keywords for scoring
const chapterKeywords = {
  'Security Principles and Practices': ['management', 'leadership', 'business', 'financial', 'budget', 'planning', 'organization', 'strategy', 'principles'],
  'Business Principles and Practices': ['asset', 'protection', 'standard', 'compliance', 'policy', 'procedure', 'business', 'operations'],
  'Investigations': ['investigation', 'evidence', 'case', 'interview', 'documentation', 'report', 'inquiry', 'examination'],
  'Personnel Security': ['personnel', 'employee', 'background', 'screening', 'staff', 'training', 'human', 'resource'],
  'Physical Security': ['physical', 'access', 'system', 'technology', 'equipment', 'facility', 'security', 'protection'],
  'Crisis Management': ['crisis', 'emergency', 'response', 'disaster', 'awareness', 'risk', 'incident', 'threat']
};

// Score a card for each chapter
function scoreCard(card, chapter) {
  const text = (card.question + ' ' + card.answer).toLowerCase();
  return chapterKeywords[chapter].reduce((score, keyword) =>
    score + (text.includes(keyword) ? 1 : 0), 0
  );
}

// Assign cards to chapters by relevance, capping at quota
const chapterAssignments = {};
Object.keys(targetDistribution).forEach(chapter => {
  chapterAssignments[chapter] = [];
});

// For each card, compute scores for all chapters
const cardScores = flashcardsData.flashcards.map(card => {
  const scores = Object.keys(targetDistribution).map(chapter => ({
    chapter,
    score: scoreCard(card, chapter)
  }));
  // Sort chapters by score descending, then by remaining quota descending
  scores.sort((a, b) => b.score - a.score);
  return { card, scores };
});

// Assign cards to chapters by best available match
cardScores.forEach(({ card, scores }) => {
  for (let i = 0; i < scores.length; i++) {
    const chapter = scores[i].chapter;
    if (chapterAssignments[chapter].length < targetDistribution[chapter]) {
      chapterAssignments[chapter].push(card);
      return;
    }
  }
  // If all quotas are full, assign to the chapter with the most remaining space
  const chapterWithSpace = Object.keys(targetDistribution).reduce((best, chapter) =>
    chapterAssignments[chapter].length < targetDistribution[chapter] &&
    (best === null || (targetDistribution[chapter] - chapterAssignments[chapter].length) > (targetDistribution[best] - chapterAssignments[best].length))
      ? chapter : best, null);
  if (chapterWithSpace) {
    chapterAssignments[chapterWithSpace].push(card);
  } else {
    // As a last resort, assign to the chapter with the smallest overflow
    const chapterWithLeastOverflow = Object.keys(targetDistribution).reduce((best, chapter) =>
      chapterAssignments[chapter].length < chapterAssignments[best].length ? chapter : best, Object.keys(targetDistribution)[0]);
    chapterAssignments[chapterWithLeastOverflow].push(card);
  }
});

// Flatten assignments into a single array
const updatedFlashcards = [];
Object.keys(chapterAssignments).forEach(chapter => {
  chapterAssignments[chapter].forEach(card => {
    updatedFlashcards.push({ ...card, category: chapter });
  });
});

// Create the updated data
const updatedData = {
  flashcards: updatedFlashcards
};

// Write the updated data back to the file
fs.writeFileSync('./assets/flashcards.json', JSON.stringify(updatedData, null, 2));

// Print final statistics
console.log('\n=== FINAL DISTRIBUTION ===');
Object.keys(targetDistribution).forEach(chapter => {
  const actualCount = updatedFlashcards.filter(card => card.category === chapter).length;
  const targetCount = targetDistribution[chapter];
  console.log(`- ${chapter}: ${actualCount}/${targetCount} cards`);
});

console.log('\nTotal cards redistributed:', updatedFlashcards.length);

// Verify the distribution
const finalDistribution = {};
Object.keys(targetDistribution).forEach(chapter => {
  finalDistribution[chapter] = updatedFlashcards.filter(card => card.category === chapter).length;
});

console.log('\n=== VERIFICATION ===');
let allCorrect = true;
Object.keys(targetDistribution).forEach(chapter => {
  const actual = finalDistribution[chapter];
  const target = targetDistribution[chapter];
  if (actual !== target) {
    console.log(`❌ ${chapter}: ${actual} vs ${target}`);
    allCorrect = false;
  } else {
    console.log(`✅ ${chapter}: ${actual} cards`);
  }
});

if (allCorrect) {
  console.log('\n🎉 All chapters have the correct number of cards!');
} else {
  console.log('\n⚠️ Some chapters need adjustment');
} 