// Test case for blacklisting champions
const fs = require('fs');

// Load the data
const gameData = JSON.parse(fs.readFileSync('./data/solver_data.json', 'utf8'));

// Simple version of the solver logic to test blacklisting
function testBlacklist(blacklistedChampions) {
    console.log('Testing with blacklisted champions:', blacklistedChampions);

    // Filter out blacklisted champions
    const allChampions = gameData.champions.filter(c =>
        !blacklistedChampions.includes(c.name)
    );

    console.log('Total champions before filter:', gameData.champions.length);
    console.log('Total champions after filter:', allChampions.length);

    // Check if specific champions are in the filtered list
    const kennenInList = allChampions.find(c => c.name === 'Kennen');
    const poppyInList = allChampions.find(c => c.name === 'Poppy');

    console.log('Kennen in filtered list?', kennenInList ? 'YES' : 'NO');
    console.log('Poppy in filtered list?', poppyInList ? 'YES' : 'NO');

    // Check exact name matches
    const kennenInData = gameData.champions.find(c => c.name === 'Kennen');
    const poppyInData = gameData.champions.find(c => c.name === 'Poppy');

    console.log('Kennen exact name in data:', JSON.stringify(kennenInData?.name));
    console.log('Poppy exact name in data:', JSON.stringify(poppyInData?.name));
    console.log('');
}

console.log('=== Test 1: No blacklist ===');
testBlacklist([]);

console.log('=== Test 2: Blacklist Kennen ===');
testBlacklist(['Kennen']);

console.log('=== Test 3: Blacklist Poppy ===');
testBlacklist(['Poppy']);

console.log('=== Test 4: Blacklist both ===');
testBlacklist(['Kennen', 'Poppy']);

console.log('=== Test 5: Blacklist Tristana (control) ===');
testBlacklist(['Tristana']);
