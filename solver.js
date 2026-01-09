/**
 * TFT World Runes Solver - Core Algorithm
 */

class TFTSolver {
    constructor(data) {
        this.champions = data.champions;
        this.fourCostChampions = data.fourCostChampions;
        this.origins = data.origins;
        this.classes = data.classes;
        this.traits = data.traits;

        // Create lookup maps
        this.originNames = new Set(this.origins.map(o => o.name));
        this.traitBreakpoints = {};
        this.traits.forEach(t => {
            this.traitBreakpoints[t.name] = t.breakpoints;
        });
    }

    /**
     * Main solver function
     * Optimized: Separate Targon champions and add them at the end
     */
    solve(emblems = [], selectedFourCosts = [], preferences = {}) {
        const {
            tankPercentage = 60,
            blacklistedChampions = []
        } = preferences;

        // Store selected 4-costs for scoring
        this.selectedFourCosts = new Set(selectedFourCosts);

        // Combine champions pool and filter out blacklisted champions
        const fourCostPool = this.fourCostChampions.filter(c =>
            selectedFourCosts.includes(c.name)
        );
        const allChampions = [...this.champions, ...fourCostPool]
            .filter(c => !blacklistedChampions.includes(c.name));

        // Separate Targon-only champions from the rest
        const targonChampions = allChampions.filter(c =>
            c.traits.length === 1 && c.traits[0] === 'Targon'
        );
        const nonTargonChampions = allChampions.filter(c =>
            !(c.traits.length === 1 && c.traits[0] === 'Targon')
        );

        // Find all valid teams
        const validTeams = [];

        // Calculate required origins based on emblems
        const requiredOrigins = Math.max(4 - emblems.length, 0);

        // Try team sizes from 3 to 5 units (non-Targon), then add 1 Targon
        for (let baseTeamSize = 3; baseTeamSize <= 5; baseTeamSize++) {
            const combinations = this.generateCombinations(nonTargonChampions, baseTeamSize);

            for (const baseTeam of combinations) {
                // Check if base team activates enough origins (with emblems)
                const baseOrigins = this.getActiveOrigins(baseTeam, emblems);
                if (baseOrigins.length < Math.max(3 - emblems.length, 0)) continue;

                // Try adding each Targon champion
                for (const targonChamp of targonChampions) {
                    const team = [...baseTeam, targonChamp];
                    const teamSize = team.length;

                    // Check if team activates 4 origins (base + emblems + Targon)
                    const teamOrigins = this.getActiveOrigins(team, emblems);
                    if (teamOrigins.length < 4) continue;

                    // Calculate tank/carry counts
                    const tankCount = team.filter(c => c.isTank).length;
                    const carryCount = team.length - tankCount;

                    // Calculate score (includes balance penalty)
                    const score = this.scoreTeam(team, emblems, tankPercentage);

                    // Calculate effective cost (4-costs already owned = 0 cost)
                    const totalCost = team.reduce((sum, c) => {
                        return sum + (this.selectedFourCosts.has(c.name) ? 0 : c.cost);
                    }, 0);

                    validTeams.push({
                        champions: team,
                        score,
                        size: teamSize,
                        tankCount,
                        carryCount,
                        totalCost,
                        traits: this.getActiveTraits(team, emblems)
                    });
                }
            }
        }

        // Sort teams: fewer units first, then higher score, then lower cost
        validTeams.sort((a, b) => {
            if (a.size !== b.size) return a.size - b.size;
            if (b.score !== a.score) return b.score - a.score;
            return a.totalCost - b.totalCost;
        });

        return validTeams;
    }

    /**
     * Get active origins for a team (including emblems)
     */
    getActiveOrigins(team, emblems = []) {
        const originCounts = {};

        // Count origins from team
        team.forEach(champ => {
            champ.traits.forEach(trait => {
                if (this.originNames.has(trait)) {
                    originCounts[trait] = (originCounts[trait] || 0) + 1;
                }
            });
        });

        // Add emblems (each adds +1)
        emblems.forEach(emblem => {
            if (emblem) {
                originCounts[emblem] = (originCounts[emblem] || 0) + 1;
            }
        });

        // Filter to origins that hit breakpoints
        const activeOrigins = [];
        for (const [origin, count] of Object.entries(originCounts)) {
            const breakpoints = this.traitBreakpoints[origin] || [];
            const hitBreakpoint = breakpoints.some(bp => count >= bp);
            if (hitBreakpoint) {
                activeOrigins.push({ name: origin, count });
            }
        }

        return activeOrigins;
    }

    /**
     * Get all active traits (origins + classes) for a team
     */
    getActiveTraits(team, emblems = []) {
        const traitCounts = {};

        // Count all traits from team
        team.forEach(champ => {
            champ.traits.forEach(trait => {
                traitCounts[trait] = (traitCounts[trait] || 0) + 1;
            });
        });

        // Add emblems for origins
        emblems.forEach(emblem => {
            if (emblem && this.originNames.has(emblem)) {
                traitCounts[emblem] = (traitCounts[emblem] || 0) + 1;
            }
        });

        // Filter to traits that hit breakpoints
        const activeTraits = [];
        for (const [trait, count] of Object.entries(traitCounts)) {
            const breakpoints = this.traitBreakpoints[trait] || [];

            // Find the highest breakpoint we've reached
            let activeBreakpoint = null;
            for (const bp of breakpoints) {
                if (count >= bp) {
                    activeBreakpoint = bp;
                }
            }

            if (activeBreakpoint !== null) {
                activeTraits.push({
                    name: trait,
                    count,
                    breakpoint: activeBreakpoint,
                    isOrigin: this.originNames.has(trait)
                });
            }
        }

        return activeTraits;
    }

    /**
     * Score a team based on multiple factors
     */
    scoreTeam(team, emblems = [], tankPercentage = 60) {
        const traits = this.getActiveTraits(team, emblems);

        // Count origins and classes at breakpoints
        const originsAtBreakpoint = traits.filter(t => t.isOrigin).length;
        const classesAtBreakpoint = traits.filter(t => !t.isOrigin).length;

        // Total breakpoints hit
        const totalBreakpoints = traits.reduce((sum, t) => {
            const allBreakpoints = this.traitBreakpoints[t.name] || [];
            return sum + allBreakpoints.filter(bp => t.count >= bp).length;
        }, 0);

        // Calculate balance penalty
        const tankCount = team.filter(c => c.isTank).length;
        const actualTankPercentage = (tankCount / team.length) * 100;
        const balanceDiff = Math.abs(actualTankPercentage - tankPercentage);
        const balancePenalty = balanceDiff * 0.5; // 0.5 points penalty per % difference

        // Total cost (4-costs already owned are free)
        const totalCost = team.reduce((sum, c) => {
            return sum + (this.selectedFourCosts.has(c.name) ? 0 : c.cost);
        }, 0);

        // Scoring formula
        const score =
            (originsAtBreakpoint * 20) +      // Each origin at breakpoint is valuable
            (classesAtBreakpoint * 15) +      // Class synergies are important
            (totalBreakpoints * 10) -         // Total breakpoints
            balancePenalty -                  // Penalty for deviation from preferred balance
            (totalCost * 2);                  // Prefer lower cost

        return Math.round(score);
    }

    /**
     * Generate all combinations of size k from array
     */
    generateCombinations(array, k) {
        const combinations = [];

        const helper = (start, combo) => {
            if (combo.length === k) {
                combinations.push([...combo]);
                return;
            }

            for (let i = start; i < array.length; i++) {
                combo.push(array[i]);
                helper(i + 1, combo);
                combo.pop();
            }
        };

        helper(0, []);
        return combinations;
    }
}

// Make solver available globally
window.TFTSolver = TFTSolver;
