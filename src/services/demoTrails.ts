import type { Trail } from '../types/trail'
import { estimateTimeHours } from '../utils/timeEstimate'
import { calcWaterLiters, calcSnackSuggestion, calcBestSeason, calcCrowdedness } from '../utils/recommendations'

function makeTrail(
  id: string, name: string, location: string,
  lat: number, lng: number,
  difficulty: Trail['difficulty'], lengthMiles: number, ascentFeet: number,
  stars: number, starVotes: number,
  trailType: Trail['trailType'],
  summary: string,
  conditionStatus?: string,
): Trail {
  const estimatedTimeHours = estimateTimeHours(lengthMiles, ascentFeet)
  return {
    id, name, location, lat, lng, difficulty, lengthMiles, ascentFeet,
    estimatedTimeHours,
    stars, starVotes,
    funLevel: Math.round(stars * 2 * 10) / 10,
    trailType, summary,
    waterLiters: calcWaterLiters(lengthMiles, ascentFeet),
    snackSuggestion: calcSnackSuggestion(estimatedTimeHours, difficulty),
    bestSeason: calcBestSeason(lat, ascentFeet + 2000),
    conditionStatus,
    crowdedness: calcCrowdedness(starVotes),
    source: 'demo',
  }
}

export const DEMO_TRAILS: Trail[] = [
  makeTrail('d1', 'Bear Peak Loop', 'Boulder, Colorado', 39.9768, -105.2978, 'hard', 5.4, 2400, 4.6, 312, 'loop', 'Strenuous climb with panoramic views of Boulder and the Flatirons.', 'Clear'),
  makeTrail('d2', 'Royal Arch Trail', 'Boulder, Colorado', 39.9805, -105.2797, 'hard', 3.4, 1360, 4.5, 521, 'out-and-back', 'Boulder icon featuring a natural sandstone arch with sweeping city and mountain views.', 'Clear'),
  makeTrail('d3', 'South Boulder Peak', 'Boulder, Colorado', 39.9612, -105.2982, 'hard', 9.5, 2800, 4.4, 187, 'loop', 'High-altitude ridge walk with exposed scrambling near the summit.'),
  makeTrail('d4', 'Chautauqua Trail', 'Boulder, Colorado', 39.9990, -105.2811, 'easy', 1.6, 240, 4.3, 890, 'out-and-back', 'A beloved classic through open meadows with Flatirons backdrop. Dog and family friendly.', 'Clear'),
  makeTrail('d5', 'Green Mountain via Ranger', 'Boulder, Colorado', 40.0050, -105.2900, 'moderate', 6.5, 2000, 4.5, 445, 'loop', 'A rewarding loop through pine forest to the summit of Green Mountain.'),
  makeTrail('d6', 'Eldorado Canyon: Rattlesnake Gulch', 'Eldorado Springs, Colorado', 39.9318, -105.2784, 'moderate', 3.8, 800, 4.2, 298, 'out-and-back', 'Scenic canyon trail past dramatic sandstone walls used by world-class climbers.', 'Clear'),
  makeTrail('d7', 'Mt. Sanitas', 'Boulder, Colorado', 40.0248, -105.2949, 'hard', 3.1, 1343, 4.6, 634, 'loop', 'One of Boulder\'s most popular and strenuous hikes with great city and mountain views.', 'Clear'),
  makeTrail('d8', 'Longs Peak – Keyhole Route', 'Estes Park, Colorado', 40.2549, -105.6150, 'expert', 15.0, 5100, 4.8, 1024, 'out-and-back', 'Colorado\'s most famous fourteener. Technical route requiring early start and experience.', 'Clear'),
  makeTrail('d9', 'Sky Pond via Glacier Gorge', 'Rocky Mountain NP, Colorado', 40.2805, -105.6407, 'hard', 9.0, 1780, 4.9, 2100, 'out-and-back', 'Stunning alpine lake nestled below dramatic spires; one of RMNP\'s crown jewels.', 'Clear'),
  makeTrail('d10', 'Half Dome – Cable Route', 'Yosemite, California', 37.7459, -119.5332, 'expert', 14.2, 4800, 4.9, 3400, 'out-and-back', 'Yosemite\'s legendary hike. Requires permit for cables section. Views are unmatched.', 'Permit Required'),
  makeTrail('d11', 'Angel\'s Landing', 'Zion, Utah', 37.2690, -112.9481, 'hard', 5.4, 1488, 4.8, 5200, 'out-and-back', 'Iconic Zion trail with chain-assisted scrambling and vertiginous canyon views.', 'Clear'),
  makeTrail('d12', 'The Narrows (Bottom-Up)', 'Zion, Utah', 37.2853, -112.9469, 'moderate', 9.4, 334, 4.7, 4100, 'out-and-back', 'Hike through the Virgin River in a stunning slot canyon. Wet shoes required.', 'Clear'),
]
