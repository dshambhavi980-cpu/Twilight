const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\adiro\\OneDrive\\Desktop\\ALL websites\\twilight-app\\components\\ui\\ModernIcons.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove invalid stroke- attributes
content = content.replace(/stroke-\/>/g, '/>');
content = content.replace(/stroke- stroke=/g, 'stroke=');
content = content.replace(/stroke-/g, ''); // Be careful here, but in this file it seems to always be a trailing mess

// 2. Remove redundant nested SVG tags
// This regex looks for <svg ...> that is NOT followed by </svg> before </motion.svg>
// Actually, it's easier to just remove any <svg ...> that is inside a motion.svg
// but preserve its content.
const lines = content.split('\n');
const newLines = [];
let insideMotionSvg = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.includes('<motion.svg')) {
        insideMotionSvg = true;
    }
    
    if (insideMotionSvg && line.trim().startsWith('<svg')) {
        // Look ahead for the end of the tag
        let tag = line;
        while (!tag.includes('>') && i < lines.length - 1) {
            i++;
            tag += lines[i];
        }
        // Check if the inner svg actually has content or is just a tag
        // If it's something like <svg ...><path .../></svg> we shouldn't just remove it if it's self-contained.
        // But the error says they are unclosed.
        
        // Let's just remove the <svg ...> part and wait for the rest.
        // We also need to check if it has a closing </svg> later.
        // For simplicity, let's just use regex for the known patterns.
        continue; 
    }
    
    if (line.includes('</motion.svg>')) {
        insideMotionSvg = false;
    }
    
    newLines.push(line);
}

// Re-read and use regex for specific patterns to be safer
content = fs.readFileSync(filePath, 'utf8');

// Remove anything like <svg ...> that is followed by <g or <path or <circle or <rect or <title or <desc
// without a closing </svg> immediately after (on the same line).
// Patterns like <svg fill="currentColor"   viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="..."/>
// are tricky.

// Let's just target the ones we saw.
const patternsToRemove = [
    /<svg fill="currentColor"\s+version="1\.1"\s+id="Layer_1"\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"\s+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"\s+viewBox="0 0 512 512" xml:space="preserve">/g,
    /<svg\s+viewBox="0 0 24 24" fill="none" xmlns="http:\/\/www\.w3\.org\/2000\/svg">/g,
    /<svg fill="currentColor"\s+viewBox="0 0 24 24" xmlns="http:\/\/www\.w3\.org\/2000\/svg">/g,
    /<svg fill="currentColor"\s+viewBox="-4\.93 0 122\.88 122\.88" version="1\.1" id="Layer_1" xmlns="http:\/\/www\.w3\.org\/2000\/svg" xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"\s+style=\{\{enableBackground: 'new 0 0 113\.01 122\.88'\}\} xml:space="preserve">/g,
    /<svg fill="currentColor"\s+viewBox="0 0 1024 1024" xmlns="http:\/\/www\.w3\.org\/2000\/svg">/g,
    /<svg fill="currentColor"\s+version="1\.1" id="Layer_1" xmlns="http:\/\/www\.w3\.org\/2000\/svg" xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"\s+viewBox="0 0 511\.999 511\.999" xml:space="preserve">/g,
    /<svg\s+viewBox="0 0 24 24" id="meteor-icon-kit__regular-chart-line" fill="none" xmlns="http:\/\/www\.w3\.org\/2000\/svg">/g,
    /<svg\s+viewBox="0 0 24 24" version="1\.1" xmlns="http:\/\/www\.w3\.org\/2000\/svg" xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink" fill="currentColor">/g,
    /<svg\s+viewBox="0 0 24 24" fill="none" xmlns="http:\/\/www\.w3\.org\/2000\/svg" transform="matrix\(-1, 0, 0, 1, 0, 0\)">/g,
    /<svg\s+viewBox="0 0 64 64" xmlns="http:\/\/www\.w3\.org\/2000\/svg" stroke- stroke="currentColor" fill="none">/g,
    /<svg\s+viewBox="0 0 512 512" xmlns="http:\/\/www\.w3\.org\/2000\/svg" fill="currentColor">/g,
    /<svg\s+viewBox="0 -0\.5 25 25" fill="none" xmlns="http:\/\/www\.w3\.org\/2000\/svg" transform="matrix\(-1, 0, 0, 1, 0, 0\)">/g,
    /<svg fill="currentColor"\s+viewBox="0 0 24 24" xmlns="http:\/\/www\.w3\.org\/2000\/svg">/g,
    /<svg\s+viewBox="0 0 24 24" fill="none" xmlns="http:\/\/www\.w3\.org\/2000\/svg" stroke="currentColor" strokeWidth="0\.288">/g
];

for (const pattern of patternsToRemove) {
    content = content.replace(pattern, '');
}

// Fix stroke- again just in case
content = content.replace(/stroke-\/>/g, '/>');
content = content.replace(/stroke- stroke=/g, 'stroke=');
content = content.replace(/stroke-/g, '');

// Also search for any stray style tags that might have broken
content = content.replace(/style="enable-background:new 0 0 [\d\.]+ [\d\.]+;"/g, ''); 

fs.writeFileSync(filePath, content);
console.log('Done cleaning ModernIcons.tsx');
