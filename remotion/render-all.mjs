import { execSync } from 'child_process';
import fs from 'fs';

const gameIds = [
    'tictactoe', 'connect-four', 'dots-boxes', 'rps', 'hangman', 'trivia', 
    'wordle', 'truth-dare', 'would-you-rather', 'this-or-that', '20-questions', 
    'emoji-charades', 'memory', 'story-builder', 'riddle-me', 'never-have-i-ever', 
    'two-truths', 'rapid-fire', 'song-lyrics'
];

if (!fs.existsSync('../public/tutorials')) {
    fs.mkdirSync('../public/tutorials', { recursive: true });
}

console.log(`Starting bulk render of ${gameIds.length} tutorial videos...\n`);

for (const id of gameIds) {
    console.log(`\n⏳ Rendering video for: ${id}...`);
    try {
        execSync(`npx remotion render src/index.ts ${id} ../public/tutorials/${id}.mp4`, { stdio: 'inherit' });
        console.log(`✅ Successfully rendered ${id}.mp4`);
    } catch (e) {
        console.error(`❌ Failed to render ${id}.mp4`, e.message);
    }
}

console.log(`\n🎉 All rendering complete! Videos are in /public/tutorials/`);
