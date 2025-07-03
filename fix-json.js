const fs = require('fs');

// Read the current file
const data = fs.readFileSync('./assets/flashcards.json', 'utf8');

// Fix the JSON structure
let fixed = data
  // Add quotes to property names
  .replace(/(\w+):/g, '"$1":')
  // Replace opening { with [
  .replace(/^\s*\{/, '[')
  // Replace closing }; with ]
  .replace(/\s*\};\s*$/, ']')
  // Fix escaped backslashes in strings
  .replace(/\\\\/g, '\\')
  // Fix escaped quotes in strings
  .replace(/\\"/g, '"')
  // Fix any remaining unescaped quotes in strings
  .replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1\\"$2\\"$3"');

// Write the fixed content back
fs.writeFileSync('./assets/flashcards.json', fixed);

console.log('JSON file fixed successfully!');

// Validate the JSON
try {
  JSON.parse(fs.readFileSync('./assets/flashcards.json', 'utf8'));
  console.log('✅ JSON validation passed!');
} catch(e) {
  console.log('❌ JSON validation failed:', e.message);
} 