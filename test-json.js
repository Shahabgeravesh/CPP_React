const fs = require('fs');

try {
  const data = require('./assets/flashcards.json');
  console.log('JSON loaded successfully!');
  console.log('Number of flashcards:', data.flashcards ? data.flashcards.length : 'No flashcards array found');
  console.log('First card:', data.flashcards ? data.flashcards[0] : 'No cards found');
} catch (error) {
  console.error('Error loading JSON:', error.message);
} 