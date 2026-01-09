// Test the actual solver with no emblems
const TFTSolver = require('./solver-test.js');
const fs = require('fs');

// Load data
const gameData = JSON.parse(fs.readFileSync('./data/solver_data.json', 'utf8'));

const solver = new TFTSolver(gameData);

console.log('=== Test 1: No emblems, no blacklist ===');
const results1 = solver.solve([], [], {});
console.log('Results found:', results1.length);
if (results1.length > 0) {
    console.log('Top 3 teams:');
    results1.slice(0, 3).forEach((team, i) => {
        console.log(`${i + 1}. Size ${team.size}, Score ${team.score.toFixed(2)}, Cost ${team.totalCost}g`);
        console.log('   Champions:', team.champions.map(c => c.name).join(', '));
    });
}
console.log('');

console.log('=== Test 2: No emblems, Kennen blacklisted ===');
const results2 = solver.solve([], [], { blacklistedChampions: ['Kennen'] });
console.log('Results found:', results2.length);
if (results2.length > 0) {
    console.log('Top 3 teams:');
    results2.slice(0, 3).forEach((team, i) => {
        console.log(`${i + 1}. Size ${team.size}, Score ${team.score.toFixed(2)}, Cost ${team.totalCost}g`);
        console.log('   Champions:', team.champions.map(c => c.name).join(', '));
    });
} else {
    console.log('NO RESULTS - This is the bug!');
}
console.log('');

console.log('=== Test 3: No emblems, Poppy blacklisted ===');
const results3 = solver.solve([], [], { blacklistedChampions: ['Poppy'] });
console.log('Results found:', results3.length);
if (results3.length > 0) {
    console.log('Top 3 teams:');
    results3.slice(0, 3).forEach((team, i) => {
        console.log(`${i + 1}. Size ${team.size}, Score ${team.score.toFixed(2)}, Cost ${team.totalCost}g`);
        console.log('   Champions:', team.champions.map(c => c.name).join(', '));
    });
} else {
    console.log('NO RESULTS - This is the bug!');
}
