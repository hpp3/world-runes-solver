// Analyze if 3 origins are achievable without Kennen/Poppy
const data = require('./data/solver_data.json');

const origins = new Set(data.origins.map(o => o.name));

// Filter out Targon-only champions and blacklisted champions
const availableChamps = data.champions.filter(c => {
    const isTargonOnly = c.traits.length === 1 && c.traits[0] === 'Targon';
    const isBlacklisted = c.name === 'Kennen';  // Test with Kennen blacklisted
    return !isTargonOnly && !isBlacklisted;
});

console.log('Available champions (excluding Targon-only and Kennen):', availableChamps.length);
console.log('');

// Try to find a team of 3-5 units that activates 3+ origins
function countOrigins(team) {
    const originCounts = {};
    team.forEach(c => {
        c.traits.forEach(t => {
            if (origins.has(t)) {
                originCounts[t] = (originCounts[t] || 0) + 1;
            }
        });
    });

    // Check which origins hit their minimum breakpoint
    const activeOrigins = [];
    for (const [origin, count] of Object.entries(originCounts)) {
        const trait = data.traits.find(t => t.name === origin);
        const minBreakpoint = trait.breakpoints[0];
        if (count >= minBreakpoint) {
            activeOrigins.push(origin);
        }
    }
    return activeOrigins;
}

// Test with a simple greedy approach - pick champions with most origins
const multiOriginChamps = availableChamps.filter(c => {
    return c.traits.filter(t => origins.has(t)).length >= 2;
});

console.log('Multi-origin champions available:', multiOriginChamps.map(c => `${c.name} (${c.traits.filter(t => origins.has(t)).join(', ')})`).join(', '));
console.log('');

// Try building a small team with multi-origin champs
if (multiOriginChamps.length >= 3) {
    const testTeam = multiOriginChamps.slice(0, 4);
    const activeOrigins = countOrigins(testTeam);
    console.log('Test team:', testTeam.map(c => c.name).join(', '));
    console.log('Active origins:', activeOrigins.length, '-', activeOrigins.join(', '));
} else {
    console.log('NOT ENOUGH multi-origin champions!');
    console.log('This is why the solver fails - it requires 3 origins before adding Targon.');
}
