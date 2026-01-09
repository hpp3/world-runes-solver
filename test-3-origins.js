// Test if we can achieve 3 origins with a 5-champion team (no Kennen)
const data = require('./data/solver_data.json');

const origins = new Set(data.origins.map(o => o.name));

// Filter champions (no Targon-only, no Kennen)
const availableChamps = data.champions.filter(c => {
    const isTargonOnly = c.traits.length === 1 && c.traits[0] === 'Targon';
    return !isTargonOnly && c.name !== 'Kennen';
});

function getActiveOrigins(team) {
    const originCounts = {};
    team.forEach(c => {
        c.traits.forEach(t => {
            if (origins.has(t)) {
                originCounts[t] = (originCounts[t] || 0) + 1;
            }
        });
    });

    const activeOrigins = [];
    for (const [origin, count] of Object.entries(originCounts)) {
        const trait = data.traits.find(t => t.name === origin);
        const minBreakpoint = trait.breakpoints[0];
        if (count >= minBreakpoint) {
            activeOrigins.push({ name: origin, count });
        }
    }
    return activeOrigins;
}

// Try: Poppy (Demacia+Yordle), Xin Zhao (Demacia+Ionia), Jarvan IV (Demacia),
// Tristana (Yordle), Kog'Maw (Void+Yordle)
const testTeam = availableChamps.filter(c =>
    c.name === 'Poppy' ||      // Demacia + Yordle
    c.name === 'Xin Zhao' ||   // Demacia + Ionia
    c.name === 'Jarvan IV' ||  // Demacia
    c.name === 'Tristana' ||   // Yordle
    c.name === 'Kog\'Maw'      // Yordle + Void
);

console.log('Test team (5 champions):');
testTeam.forEach(c => console.log('  -', c.name, ':', c.traits.filter(t => origins.has(t)).join(', ')));
console.log('');

const activeOrigins = getActiveOrigins(testTeam);
console.log('Active origins:', activeOrigins.length);
activeOrigins.forEach(o => console.log('  -', o.name, ':', o.count));
console.log('');

if (activeOrigins.length >= 3) {
    console.log('SUCCESS! This team activates 3+ origins.');
    console.log('So the solver SHOULD be finding teams without Kennen.');
} else {
    console.log('NOT ENOUGH origins. Need to try a different combination.');
}
