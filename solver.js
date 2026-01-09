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
        const maxResults = 1000; // Stop after finding this many valid teams

        // Try all team sizes from 4 to 8 (including Targon)
        // 4th origin is always Targon
        for (let teamSize = 4; teamSize <= 8 && validTeams.length < maxResults; teamSize++) {
            const baseTeamSize = teamSize - 1; // Reserve 1 slot for Targon

            // Use generator for lazy evaluation - no memory explosion!
            for (const baseTeam of this.generateCombinationsLazy(nonTargonChampions, baseTeamSize)) {
                if (validTeams.length >= maxResults) break;

                // FAST PRUNING: Skip if can't possibly hit 4 origins
                if (!this.canHitFourOrigins(baseTeam, emblems)) continue;

                // Try adding each Targon champion
                for (const targonChamp of targonChampions) {
                    if (validTeams.length >= maxResults) break;

                    const team = [...baseTeam, targonChamp];

                    // Calculate traits ONCE (optimization: was calculated 3x before)
                    const traitCounts = this.getTraitCounts(team, emblems);
                    const teamOrigins = this.getActiveOriginsFromCounts(traitCounts);
                    if (teamOrigins.length < 4) continue;

                    // Get active traits from the same trait counts
                    const activeTraits = this.getActiveTraitsFromCounts(traitCounts);

                    // Calculate tank/carry counts
                    const tankCount = team.filter(c => c.isTank).length;
                    const carryCount = team.length - tankCount;

                    // Calculate score (reuse activeTraits)
                    const score = this.scoreTeam(team, emblems, tankPercentage);

                    // Calculate effective cost
                    const totalCost = this.getTotalCost(team);

                    validTeams.push({
                        champions: team,
                        score,
                        size: team.length,
                        tankCount,
                        carryCount,
                        totalCost,
                        traits: activeTraits
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
     * Generate combinations lazily using a generator
     * Memory efficient: yields one combination at a time
     */
    *generateCombinationsLazy(array, k) {
        function* helper(start, combo) {
            if (combo.length === k) {
                yield [...combo];
                return;
            }

            for (let i = start; i < array.length; i++) {
                combo.push(array[i]);
                yield* helper(i + 1, combo);
                combo.pop();
            }
        }

        yield* helper(0, []);
    }

    /**
     * Count traits from team and emblems (computed once, reused)
     */
    getTraitCounts(team, emblems) {
        const traitCounts = {};

        // Count traits from team
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

        return traitCounts;
    }

    /**
     * Get active origins from pre-computed trait counts
     */
    getActiveOriginsFromCounts(traitCounts) {
        const activeOrigins = [];
        for (const [origin, count] of Object.entries(traitCounts)) {
            if (!this.originNames.has(origin)) continue;
            const breakpoints = this.traitBreakpoints[origin] || [];
            if (breakpoints.some(bp => count >= bp)) {
                activeOrigins.push({ name: origin, count });
            }
        }
        return activeOrigins;
    }

    /**
     * Get all active traits from pre-computed trait counts
     */
    getActiveTraitsFromCounts(traitCounts) {
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
     * Fast pruning check: Can this base team + Targon + emblems hit 4 origins?
     */
    canHitFourOrigins(baseTeam, emblems) {
        const originCounts = {};
        baseTeam.forEach(c => {
            c.traits.forEach(t => {
                if (this.originNames.has(t)) {
                    originCounts[t] = (originCounts[t] || 0) + 1;
                }
            });
        });

        // Add emblems
        emblems.forEach(emblem => {
            if (emblem && this.originNames.has(emblem)) {
                originCounts[emblem] = (originCounts[emblem] || 0) + 1;
            }
        });

        // Count origins that can hit their minimum breakpoint
        let potentialOrigins = 0;
        for (const [origin, count] of Object.entries(originCounts)) {
            const minBp = this.traitBreakpoints[origin]?.[0] || 1;
            if (count >= minBp) {
                potentialOrigins++;
            }
        }

        // Targon always adds 1 (assuming we'll add a Targon champion)
        potentialOrigins++;

        return potentialOrigins >= 4;
    }

    /**
     * Calculate total effective cost (4-costs already owned = 0 cost)
     */
    getTotalCost(team) {
        return team.reduce((sum, c) => {
            return sum + (this.selectedFourCosts.has(c.name) ? 0 : c.cost);
        }, 0);
    }
}

// Make solver available globally
window.TFTSolver = TFTSolver;
