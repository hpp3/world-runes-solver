/**
 * TFT World Runes Solver - UI Controller
 */

let solver;
let gameData;

// Community Dragon CDN base URL
const CDN_BASE = 'https://raw.communitydragon.org/latest/game/';

/**
 * Initialize the app
 */
async function init() {
    try {
        // Load game data
        const response = await fetch('data/solver_data.json');
        gameData = await response.json();

        // Initialize solver
        solver = new TFTSolver(gameData);

        // Populate UI
        populateEmblemPicker();
        populateUnlockablePicker();
        populateFourCostPicker();

        // Attach event listeners
        document.getElementById('solveBtn').addEventListener('click', handleSolve);

        // Setup tooltips
        setupTooltips();
        setupUnlockTooltips();

        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to load game data. Please refresh the page.');
    }
}

/**
 * Setup tooltip functionality
 */
function setupTooltips() {
    document.querySelectorAll('.help-icon').forEach(icon => {
        const tooltipText = icon.dataset.tooltip;

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        icon.appendChild(tooltip);

        // Show on hover
        icon.addEventListener('mouseenter', () => {
            tooltip.classList.add('show');
        });

        // Hide on leave
        icon.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });

        // Mobile: toggle on click
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            tooltip.classList.toggle('show');
        });
    });

    // Hide tooltips when clicking anywhere
    document.addEventListener('click', () => {
        document.querySelectorAll('.tooltip.show').forEach(tooltip => {
            tooltip.classList.remove('show');
        });
    });
}

/**
 * Setup unlock condition tooltips
 */
function setupUnlockTooltips() {
    const triggers = document.querySelectorAll('.unlockable-tooltip-trigger, .champion-tooltip-trigger');

    triggers.forEach(trigger => {
        const unlockCondition = trigger.dataset.unlock;
        if (!unlockCondition) return;

        // Skip if tooltip already exists
        if (trigger.querySelector('.unlock-tooltip')) return;

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'unlock-tooltip';
        tooltip.textContent = unlockCondition;
        trigger.appendChild(tooltip);

        // Show on hover
        trigger.addEventListener('mouseenter', () => {
            tooltip.classList.add('show');
        });

        // Hide on leave
        trigger.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });

        // Mobile: toggle on click (only for champion icons in results, not picker)
        if (trigger.classList.contains('champion-tooltip-trigger')) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                tooltip.classList.toggle('show');
            });
        }
    });
}

// Global click handler to hide all unlock tooltips (set up once)
if (!window.unlockTooltipHandlerAdded) {
    document.addEventListener('click', () => {
        document.querySelectorAll('.unlock-tooltip.show').forEach(tooltip => {
            tooltip.classList.remove('show');
        });
    });
    window.unlockTooltipHandlerAdded = true;
}

/**
 * Populate emblem picker grid
 */
function populateEmblemPicker() {
    const picker = document.getElementById('emblemPicker');

    // Only show origins that have emblems (filter out Shadow Isles, Targon, Shurima)
    const origins = gameData.origins
        .filter(o => o.emblemIcon !== null)
        .sort((a, b) => a.name.localeCompare(b.name));

    origins.forEach(origin => {
        const div = document.createElement('div');
        div.className = 'emblem-option';
        div.dataset.origin = origin.name;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'emblem-icon';

        const img = document.createElement('img');
        img.src = convertIconPath(origin.emblemIcon);
        img.alt = origin.name + ' Emblem';
        img.draggable = false;

        iconDiv.appendChild(img);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'emblem-name';
        nameSpan.textContent = origin.name;

        div.appendChild(iconDiv);
        div.appendChild(nameSpan);

        // Toggle selection on click
        div.addEventListener('click', () => {
            div.classList.toggle('selected');
        });

        picker.appendChild(div);
    });
}

/**
 * Populate unlockable champion picker
 */
function populateUnlockablePicker() {
    const picker = document.getElementById('unlockablePicker');

    // Get all 1-3 cost champions with unlockCondition
    const unlockables = gameData.champions
        .filter(c => c.unlockCondition && c.cost <= 3)
        .sort((a, b) => {
            // Sort by cost first, then name
            if (a.cost !== b.cost) return a.cost - b.cost;
            return a.name.localeCompare(b.name);
        });

    unlockables.forEach(champ => {
        const div = document.createElement('div');
        div.className = `unlockable-option cost-${champ.cost} unlockable-tooltip-trigger`;
        div.dataset.champion = champ.name;
        div.dataset.unlock = champ.unlockCondition;

        const img = document.createElement('img');
        img.src = convertIconPath(champ.icon);
        img.alt = champ.name;
        img.draggable = false;

        // Fallback if image fails to load
        img.onerror = () => {
            div.style.background = '#333';
            div.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.6em;text-align:center;padding:2px;color:#999;">${champ.name}</div>`;
        };

        div.appendChild(img);

        // Toggle blacklist on click (default: enabled/not blacklisted)
        div.addEventListener('click', () => {
            div.classList.toggle('blacklisted');
        });

        picker.appendChild(div);
    });
}

/**
 * Populate 4-cost champion picker
 */
function populateFourCostPicker() {
    const picker = document.getElementById('fourCostPicker');

    const fourCosts = gameData.fourCostChampions.sort((a, b) => a.name.localeCompare(b.name));

    fourCosts.forEach(champ => {
        const div = document.createElement('div');
        div.className = 'four-cost-option';
        div.dataset.champion = champ.name;
        div.title = champ.name;

        const img = document.createElement('img');
        img.src = convertIconPath(champ.icon);
        img.alt = champ.name;
        img.draggable = false;

        // Fallback if image fails to load
        img.onerror = () => {
            div.style.background = '#333';
            div.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.6em;text-align:center;padding:2px;color:#999;">${champ.name}</div>`;
        };

        div.appendChild(img);

        // Toggle selection on click
        div.addEventListener('click', () => {
            div.classList.toggle('selected');
        });

        picker.appendChild(div);
    });
}

/**
 * Handle solve button click
 */
async function handleSolve() {
    // Get selected emblems
    const selectedEmblems = [];
    document.querySelectorAll('#emblemPicker .emblem-option.selected').forEach(el => {
        selectedEmblems.push(el.dataset.origin);
    });

    // Get blacklisted unlockables
    const blacklistedUnlockables = [];
    document.querySelectorAll('#unlockablePicker .unlockable-option.blacklisted').forEach(el => {
        blacklistedUnlockables.push(el.dataset.champion);
    });

    // Get selected 4-costs
    const selectedFourCosts = [];
    document.querySelectorAll('#fourCostPicker .four-cost-option.selected').forEach(el => {
        selectedFourCosts.push(el.dataset.champion);
    });

    // Get preferences (hardcoded 60% tank balance)
    const preferences = {
        tankPercentage: 60,
        blacklistedChampions: blacklistedUnlockables
    };

    // Show loading
    document.getElementById('loadingIndicator').classList.remove('hidden');
    document.getElementById('resultsContainer').innerHTML = '';

    // Run solver in next tick to allow UI to update
    setTimeout(() => {
        try {
            const results = solver.solve(selectedEmblems, selectedFourCosts, preferences);
            displayResults(results, selectedEmblems);
        } catch (error) {
            console.error('Solver error:', error);
            alert('An error occurred while solving. Check console for details.');
        } finally {
            document.getElementById('loadingIndicator').classList.add('hidden');
        }
    }, 100);
}

/**
 * Display results
 */
function displayResults(teams, emblems) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    if (teams.length === 0) {
        container.innerHTML = '<p class="placeholder">No valid teams found with the selected criteria. Try adjusting your preferences.</p>';
        return;
    }

    // Limit to top 50 results for performance
    const displayTeams = teams.slice(0, 50);

    displayTeams.forEach((team, index) => {
        const card = createTeamCard(team, index + 1, emblems);
        container.appendChild(card);
    });

    if (teams.length > 50) {
        const message = document.createElement('p');
        message.className = 'placeholder';
        message.textContent = `Showing top 50 of ${teams.length} results`;
        container.appendChild(message);
    }

    // Setup tooltips for unlockable champions in results
    setupUnlockTooltips();
}

/**
 * Create a team card element
 */
function createTeamCard(team, index, emblems) {
    const card = document.createElement('div');
    card.className = 'team-card';

    // Header with stats only
    const header = document.createElement('div');
    header.className = 'team-header';

    const stats = document.createElement('div');
    stats.className = 'team-stats';
    stats.innerHTML = `
        <div class="stat">
            <span class="stat-label">Score:</span>
            <span class="stat-value">${team.score}</span>
        </div>
        <div class="stat">
            <span class="stat-label">Cost:</span>
            <span class="stat-value">${team.totalCost}g</span>
        </div>
        <div class="stat">
            <span class="stat-label">Units:</span>
            <span class="stat-value">${team.size}</span>
        </div>
    `;

    header.appendChild(stats);
    card.appendChild(header);

    // Champions row - sort by cost (lowest first)
    const championsRow = document.createElement('div');
    championsRow.className = 'champions-row';

    const sortedChampions = [...team.champions].sort((a, b) => a.cost - b.cost);

    sortedChampions.forEach(champ => {
        // Check if this is a Targon carry (Aphelios or Diana) - display as dual with Zoe
        if ((champ.name === 'Aphelios' || champ.name === 'Diana') &&
            champ.traits.length === 1 && champ.traits[0] === 'Targon') {
            const dualIcon = createDualTargonIcon([champ.name, 'Zoe'], champ.cost);
            championsRow.appendChild(dualIcon);
        } else {
            const champIcon = createChampionIcon(champ);
            championsRow.appendChild(champIcon);
        }
    });

    // Team content (champions + traits side by side)
    const teamContent = document.createElement('div');
    teamContent.className = 'team-content';

    teamContent.appendChild(championsRow);

    // Traits container - origins first, then classes
    const traitsContainer = document.createElement('div');
    traitsContainer.className = 'traits-container';

    const origins = team.traits.filter(t => t.isOrigin);
    const classes = team.traits.filter(t => !t.isOrigin);

    // Add origins first
    origins.forEach(trait => {
        const traitPill = createTraitPill(trait, 'origin', emblems);
        traitsContainer.appendChild(traitPill);
    });

    // Then add classes
    classes.forEach(trait => {
        const traitPill = createTraitPill(trait, 'class', emblems);
        traitsContainer.appendChild(traitPill);
    });

    teamContent.appendChild(traitsContainer);
    card.appendChild(teamContent);

    return card;
}

/**
 * Create champion icon element
 */
function createChampionIcon(champ) {
    const div = document.createElement('div');
    div.className = `champion-icon cost-${champ.cost}`;

    // Add unlock condition data attribute if present
    if (champ.unlockCondition) {
        div.classList.add('champion-tooltip-trigger');
        div.dataset.unlock = champ.unlockCondition;
    }

    const img = document.createElement('img');
    img.src = convertIconPath(champ.icon);
    img.alt = champ.name;
    img.onerror = () => {
        // Fallback if image fails to load
        div.style.background = '#333';
        div.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.7em;text-align:center;padding:2px;">${champ.name}</div>`;
    };

    div.appendChild(img);

    // Add lock icon if champion is unlockable
    if (champ.unlockCondition) {
        const lockIcon = document.createElement('div');
        lockIcon.className = 'lock-icon';
        lockIcon.innerHTML = '🔒';
        div.appendChild(lockIcon);
    }

    return div;
}

/**
 * Create dual champion icon (split diagonally)
 */
function createDualTargonIcon(champNames, cost) {
    const div = document.createElement('div');
    div.className = 'champion-icon dual';

    // Get champion data
    const champ1 = gameData.fourCostChampions.find(c => c.name === champNames[0]) ||
                   gameData.champions.find(c => c.name === champNames[0]);

    // For Zoe, create a dummy object with icon path (since we removed her from data)
    const champ2 = champNames[1] === 'Zoe' ? {
        name: 'Zoe',
        icon: 'ASSETS/Characters/TFT16_Zoe/HUD/TFT16_Zoe_Square.TFT_Set16.tex'
    } : (gameData.fourCostChampions.find(c => c.name === champNames[1]) ||
         gameData.champions.find(c => c.name === champNames[1]));

    // Add unlock condition data attribute if present
    if (champ1?.unlockCondition) {
        div.classList.add('champion-tooltip-trigger');
        div.dataset.unlock = champ1.unlockCondition;
    }

    if (champ1 && champ2) {
        const img1 = document.createElement('img');
        img1.src = convertIconPath(champ1.icon);
        img1.alt = champ1.name;
        img1.className = 'dual-left';

        const img2 = document.createElement('img');
        img2.src = convertIconPath(champ2.icon);
        img2.alt = champ2.name;
        img2.className = 'dual-right';

        div.appendChild(img1);
        div.appendChild(img2);

        // Add lock icon if champion is unlockable
        if (champ1?.unlockCondition) {
            const lockIcon = document.createElement('div');
            lockIcon.className = 'lock-icon';
            lockIcon.innerHTML = '🔒';
            div.appendChild(lockIcon);
        }
    }

    return div;
}

/**
 * Create trait pill element
 */
function createTraitPill(trait, type, emblems = []) {
    const pill = document.createElement('div');
    pill.className = `trait-pill ${type}`;

    const traitData = gameData.traits.find(t => t.name === trait.name);

    // Trait icon
    if (traitData) {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'trait-icon';

        const img = document.createElement('img');
        img.src = convertIconPath(traitData.icon);
        img.alt = trait.name;

        iconDiv.appendChild(img);
        pill.appendChild(iconDiv);
    }

    // Trait name
    const name = document.createElement('span');
    name.className = 'trait-name';
    name.textContent = trait.name;
    pill.appendChild(name);

    // Trait count
    const count = document.createElement('span');
    count.className = 'trait-count';
    count.textContent = trait.count;
    pill.appendChild(count);

    // Show lightning if emblem is active
    const isEmblem = emblems.includes(trait.name);
    if (isEmblem) {
        const lightning = document.createElement('span');
        lightning.className = 'trait-emblem';
        lightning.textContent = '⚡';
        lightning.title = 'Emblem active';
        pill.appendChild(lightning);
    }

    return pill;
}

/**
 * Convert game asset path to CDN URL
 */
function convertIconPath(path) {
    // Convert ASSETS/... path to CDN URL
    // Example: ASSETS/Characters/TFT16_Tristana/... -> https://raw.communitydragon.org/latest/game/assets/characters/tft16_tristana/...
    const cleanPath = path
        .replace(/^ASSETS\//, 'assets/')
        .replace(/\.tex$/, '.png')
        .replace(/\.TFT_Set16\.tex$/, '.png')
        .toLowerCase();

    return CDN_BASE + cleanPath;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
