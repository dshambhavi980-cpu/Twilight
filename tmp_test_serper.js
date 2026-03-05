import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_SERPER_API || process.env.SERPER_API_KEY;

async function testSerper() {
    const lat = 28.7041;
    const lon = 77.1025;
    
    console.log("=== Test 4: q='pharmacy', location='Delhi, India' ===");
    const res4 = await fetch('https://google.serper.dev/places', {
        method: 'POST',
        headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: 'pharmacy', location: 'Delhi, India' })
    });
    console.log(await res4.json());

    console.log("=== Test 5: Serper Search API with location parameter ===");
    const res5 = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: 'pharmacy near me', location: 'Delhi, India' })
    });
    console.log(await res5.json());
}

testSerper();
