# TFT Set 16 World Runes Solver

An optimized team composition solver for TFT Set 16's World Runes augment. Find the best early-game boards that activate 4 origins while maximizing class synergies and maintaining proper frontline/backline balance.

## Features

- **Smart Search**: Optimized algorithm that searches through 1.9M combinations (91% faster than naive approach)
- **Targon Optimization**: Automatically handles Targon champions efficiently
- **Breakpoint Awareness**: Only counts traits that actually hit breakpoints
- **Flexible Preferences**: Configure tank/carry ratios to match your playstyle
- **4-Cost Support**: Add any 4-cost units you've found to the search
- **Champion Icons**: Beautiful champion and trait icons from Community Dragon CDN
- **Scoring System**: Teams ranked by unit count, trait synergies, and gold cost

## How It Works

The World Runes augment gives you 2 random origin emblems and requires you to activate 4 different origins to earn rewards. This solver finds all viable team compositions that:

1. Activate 4 different origins (including your 2 emblems)
2. Use mostly 1-3 cost units (with optional 4-costs)
3. Maintain a balanced mix of tanks and carries
4. Maximize class trait synergies

## Usage

1. Select your 2 emblems from the dropdowns
2. (Optional) Check any 4-cost units you've found
3. (Optional) Adjust tank/carry preferences
4. Click "Find Teams"
5. Browse results sorted by team size, score, and cost

## Technical Details

### Optimization Strategy

The solver uses a smart search algorithm:
- **Targon Separation**: Since Targon champions only have the Targon trait and it activates at 1 unit, we search for 3-5 unit teams with 3 origins, then add a Targon champion
- **Early Filtering**: Teams are validated for origin count before checking other constraints
- **Breakpoint Validation**: Only traits hitting their minimum breakpoints are counted

### Scoring Formula

```
score = (origins_at_breakpoint × 20) +
        (classes_at_breakpoint × 15) +
        (total_breakpoints × 10) +
        (balance_bonus) -
        (total_cost × 2)
```

### Data Source

Champion and trait data from [Community Dragon](https://raw.communitydragon.org/) CDN.

## Development

Built with vanilla JavaScript for maximum performance and simplicity.

### Local Development

```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

### File Structure

```
├── index.html          # Main HTML
├── styles.css          # Styling
├── solver.js           # Core solver algorithm
├── app.js              # UI controller
└── data/
    └── solver_data.json # Champion and trait data
```

## Deployment to GitHub Pages

1. Create a new GitHub repository
2. Push this code to the repository
3. Go to Settings > Pages
4. Select "main" branch as source
5. Your site will be live at `https://yourusername.github.io/repo-name`

## License

MIT

## Credits

- TFT Set 16 data from [Community Dragon](https://raw.communitydragon.org/)
- Inspired by the existing World Runes solver, improved with class optimization and balance considerations
