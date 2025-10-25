import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST request' });
  }

  try {
    // Get data from request body
    const { fullName, dob, tob, pob, gender } = req.body;

    // Validate required fields
    if (!fullName || !dob || !tob || !pob) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: {
          fullName: 'Full name of the person',
          dob: 'Date of birth (YYYY-MM-DD)',
          tob: 'Time of birth (HH:MM)',
          pob: 'Place of birth'
        }
      });
    }

    // Get coordinates for the place of birth
    const coordinates = await getCoordinates(pob);
    
    // OPTION 1: Use a professional astrology API 
    // Replace this section with your API credentials and endpoint
    // Example: const apiKey = process.env.ASTROLOGY_API_KEY;
    
    // OPTION 2: Use a professional npm package for accurate calculations
    // This would require installing and configuring a specialized package
    
    // For now, we'll use a simplified but more accurate approach
    // Parse date components
    const [year, month, day] = dob.split('-').map(Number);
    const [hour, minute] = tob.split(':').map(Number);
    
    // Calculate astronomical positions based on accurate algorithms
    // This is where you would integrate with a professional library
    // For demonstration, we'll use enhanced calculations
    
    // Calculate ascendant (Lagna) - using more accurate formula
    const ascendant = calculateAccurateAscendant(dob, tob, coordinates.lat, coordinates.lng);
    
    // Calculate houses (Bhavas) - using proper Vedic system
    const houses = calculateAccurateHouses(dob, tob, coordinates.lat, coordinates.lng);
    
    // Calculate planetary positions - using ephemeris data
    const planets = await calculateAccuratePlanetaryPositions(dob, tob, coordinates.lat, coordinates.lng);
    
    // Calculate doshas - using proper Vedic rules
    const doshas = calculateAccurateDoshas(planets);
    
    // Generate professional interpretation
    const interpretation = generateAccurateInterpretation(planets, ascendant);
    
    // Assemble the complete kundli data
    const kundliData = {
      personalInfo: {
        fullName,
        dateOfBirth: dob,
        timeOfBirth: tob,
        placeOfBirth: pob,
        gender: gender || 'Not specified',
        coordinates: coordinates
      },
      ascendant: ascendant,
      houses: houses,
      planets: planets,
      doshas: doshas,
      interpretation: interpretation,
      disclaimer: "This Kundli uses astronomical calculations for accuracy. For detailed guidance, please consult with a professional astrologer."
    };
    
    return res.status(200).json(kundliData);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Error generating kundli', 
      details: error.message
    });
  }
}

// Helper function to get coordinates from place name using a geocoding API
async function getCoordinates(placeName) {
  try {
    // Using the public Nominatim API (OpenStreetMap)
    // In production, you should use a service with appropriate rate limits and terms of service
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: placeName,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'Kundli-Generator/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    console.error('Error getting coordinates:', error);
    throw new Error(`Could not find coordinates for the given place: ${placeName}`);
  }
}

// Function to calculate doshas based on planet positions
function calculateDoshas(planets) {
  // Implementation would depend on the structure of planet data from the API
  // This is a placeholder - in a real implementation, you would use
  // proper astrological rules to determine doshas
  
  // Extract Mars for Mangal Dosha calculation
  const mars = planets.find(p => p.name === 'Mars');
  const mangalDosha = mars && [1, 4, 7, 8, 12].includes(mars.house);
  
  // Extract Rahu and Ketu for Kaal Sarpa Dosha
  const rahu = planets.find(p => p.name === 'Rahu');
  const ketu = planets.find(p => p.name === 'Ketu');
  
  // Simplified Kaal Sarpa Dosha check
  // A proper implementation would check if all planets are between Rahu and Ketu
  let kaalSarpaDosha = false;
  if (rahu && ketu) {
    // This is a simplified check
    const otherPlanets = planets.filter(p => !['Rahu', 'Ketu'].includes(p.name));
    
    // Check if all planets are on one side of the Rahu-Ketu axis
    // This is a simplified implementation
    kaalSarpaDosha = otherPlanets.every(planet => {
      // Implementation depends on how the API provides longitude data
      return true; // Placeholder
    });
  }
  
  return {
    mangalDosha,
    kaalSarpaDosha
  };
}

// Function to generate interpretation based on planet positions
function generateInterpretation(planets, ascendant) {
  // Extract key planets
  const sun = planets.find(p => p.name === 'Sun');
  const moon = planets.find(p => p.name === 'Moon');
  
  // Define characteristics of each sign
  const signCharacteristics = {
    'Aries': 'energetic, confident, and impulsive',
    'Taurus': 'reliable, practical, and stubborn',
    'Gemini': 'versatile, curious, and inconsistent',
    'Cancer': 'intuitive, emotional, and protective',
    'Leo': 'dramatic, confident, and generous',
    'Virgo': 'analytical, practical, and perfectionist',
    'Libra': 'diplomatic, fair-minded, and sociable',
    'Scorpio': 'passionate, determined, and intense',
    'Sagittarius': 'optimistic, freedom-loving, and philosophical',
    'Capricorn': 'disciplined, responsible, and reserved',
    'Aquarius': 'independent, humanitarian, and intellectual',
    'Pisces': 'compassionate, intuitive, and dreamy'
  };
  
  // Define house meanings
  const houseThemes = {
    1: 'self-identity and physical appearance',
    2: 'finances and personal resources',
    3: 'communication and early education',
    4: 'home and family',
    5: 'creativity and romance',
    6: 'health and daily routines',
    7: 'partnerships and relationships',
    8: 'transformation and shared resources',
    9: 'higher education and philosophy',
    10: 'career and public reputation',
    11: 'friendships and aspirations',
    12: 'spirituality and the subconscious'
  };
  
  // Count planets in each house to find focus areas
  const houseCounts = {};
  planets.forEach(planet => {
    if (planet.house) {
      houseCounts[planet.house] = (houseCounts[planet.house] || 0) + 1;
    }
  });
  
  // Find the top 3 houses with most planets
  const topHouses = Object.entries(houseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => parseInt(entry[0]));
  
  // Generate interpretation text
  return {
    personality: `As a ${sun?.sign || 'Unknown'}, you tend to be ${signCharacteristics[sun?.sign] || 'balanced and multifaceted'}.`,
    emotions: `With Moon in ${moon?.sign || 'Unknown'}, your emotional nature is ${signCharacteristics[moon?.sign] || 'balanced and multifaceted'}.`,
    ascendant: `Your Ascendant (Lagna) is ${ascendant || 'Unknown'}, giving you ${signCharacteristics[ascendant] || 'balanced and multifaceted'} qualities in how you present yourself.`,
    lifeThemes: `The position of planets in your chart suggests focus in the areas of ${topHouses.map(house => houseThemes[house] || `house ${house}`).join(', ') || 'various areas of life'}.`
  };
}

// ---------- ACCURATE ASTRONOMICAL CALCULATION FUNCTIONS ----------

// Calculate accurate ascendant
function calculateAccurateAscendant(date, time, lat, lng) {
  // Parse date and time
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  
  // Create date object - ensure UTC
  const dateObj = new Date(Date.UTC(year, month-1, day, hour, minute, 0));
  
  // Calculate Julian Day
  const jd = calculateJulianDay(dateObj);
  
  // Calculate sidereal time at Greenwich
  const gst = calculateGreenwichSiderealTime(jd);
  
  // Calculate local sidereal time
  let lst = (gst + lng / 15) % 24;
  if (lst < 0) lst += 24;
  
  // Calculate RAMC (Right Ascension of the Midheaven)
  const ramc = lst * 15; // Convert hours to degrees
  
  // Calculate obliquity of the ecliptic with higher precision
  const t = (jd - 2451545.0) / 36525;
  const obliquity = 23.43929111 - 0.01300416667 * t - 0.00000016389 * t * t + 0.00000050361 * t * t * t;
  
  // Convert latitude to radians
  const latRad = lat * Math.PI / 180;
  const obliquityRad = obliquity * Math.PI / 180;
  
  // Calculate ascendant using proper formula
  const y = -Math.cos(ramc * Math.PI / 180);
  const x = Math.sin(ramc * Math.PI / 180) * Math.cos(obliquityRad) + 
           Math.tan(latRad) * Math.sin(obliquityRad);
  
  let ascRad = Math.atan2(y, x);
  let ascDeg = (ascRad * 180 / Math.PI) % 360;
  if (ascDeg < 0) ascDeg += 360;
  
  return ascDeg;
}

// Calculate accurate houses
function calculateAccurateHouses(date, time, lat, lng) {
  // In Vedic astrology, houses are often equal to signs, starting from the ascendant
  // Parse date and time
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  
  // Create date object - ensure UTC
  const dateObj = new Date(Date.UTC(year, month-1, day, hour, minute, 0));
  
  // Calculate Julian Day
  const jd = calculateJulianDay(dateObj);
  
  // Calculate ascendant with high precision
  const ascDeg = calculateAccurateAscendant(date, time, lat, lng);
  
  // Convert to sidereal position using Lahiri ayanamsa
  const ayanamsa = calculateLahiriAyanamsa(jd);
  const siderealAscDeg = (ascDeg - ayanamsa + 360) % 360;
  
  // Get the ascendant sign
  const ascSign = getSignFromLongitude(siderealAscDeg);
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  const ascSignIndex = signs.indexOf(ascSign);
  const houses = [];
  
  // In traditional Vedic astrology (Jyotish), the Whole Sign system is often used
  // where each house corresponds to one complete sign, starting from the ascendant
  for (let i = 0; i < 12; i++) {
    const houseSignIndex = (ascSignIndex + i) % 12;
    houses.push({
      house: i + 1,
      sign: signs[houseSignIndex],
      startDegree: (houseSignIndex * 30) % 360,
      endDegree: ((houseSignIndex + 1) * 30) % 360
    });
  }
  
  return houses;
}

// Calculate accurate planetary positions
async function calculateAccuratePlanetaryPositions(date, time, lat, lng) {
  // This function would ideally use Swiss Ephemeris or a similar
  // high-precision astronomical library
  
  // Parse date and time
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  
  // Create date object - ensure UTC
  const dateObj = new Date(Date.UTC(year, month-1, day, hour, minute, 0));
  
  // Calculate Julian Day
  const jd = calculateJulianDay(dateObj);
  
  // Define planets to calculate
  const planetData = [
    { id: 'sun', name: 'Sun', longitude: calculateSunLongitude(jd) },
    { id: 'moon', name: 'Moon', longitude: calculateMoonLongitude(jd) },
    { id: 'mercury', name: 'Mercury', longitude: calculatePlanetLongitude('mercury', jd) },
    { id: 'venus', name: 'Venus', longitude: calculatePlanetLongitude('venus', jd) },
    { id: 'mars', name: 'Mars', longitude: calculatePlanetLongitude('mars', jd) },
    { id: 'jupiter', name: 'Jupiter', longitude: calculatePlanetLongitude('jupiter', jd) },
    { id: 'saturn', name: 'Saturn', longitude: calculatePlanetLongitude('saturn', jd) },
    { id: 'rahu', name: 'Rahu', longitude: calculateNodeLongitude(jd) },
    { id: 'ketu', name: 'Ketu', longitude: (calculateNodeLongitude(jd) + 180) % 360 }
  ];
  
  // Apply ayanamsa correction for sidereal zodiac
  const ayanamsa = calculateLahiriAyanamsa(jd);
  
  // Calculate houses for assigning planets to houses
  const houses = calculateAccurateHouses(date, time, lat, lng);
  
  const results = [];
  
  for (const planet of planetData) {
    // Convert to sidereal longitude
    const siderealLongitude = (planet.longitude - ayanamsa + 360) % 360;
    
    // Determine sign and house
    const sign = getSignFromLongitude(siderealLongitude);
    const house = findHouseForLongitude(siderealLongitude, houses);
    
    // Calculate nakshatra and pada
    const nakshatra = calculateNakshatra(siderealLongitude);
    
    results.push({
      name: planet.name,
      longitude: siderealLongitude,
      sign: sign,
      degree: siderealLongitude % 30,
      house: house,
      nakshatra: nakshatra.name,
      pada: nakshatra.pada,
      ruler: nakshatra.ruler
    });
  }
  
  return results;
}

// Calculate Nakshatra (lunar mansion) and pada (quarter)
function calculateNakshatra(siderealLongitude) {
  // 27 Nakshatras, each spanning 13°20' (13.33333 degrees)
  const nakshatraSpan = 13 + (1/3);
  
  // Calculate nakshatra index (0-26)
  const nakshatraIndex = Math.floor(siderealLongitude / nakshatraSpan);
  
  // Calculate pada (quarter) within the nakshatra (1-4)
  const positionInNakshatra = siderealLongitude % nakshatraSpan;
  const pada = Math.floor(positionInNakshatra / (nakshatraSpan / 4)) + 1;
  
  // Nakshatra names and their planetary rulers
  const nakshatras = [
    { name: 'Ashwini', ruler: 'Ketu' },
    { name: 'Bharani', ruler: 'Venus' },
    { name: 'Krittika', ruler: 'Sun' },
    { name: 'Rohini', ruler: 'Moon' },
    { name: 'Mrigashira', ruler: 'Mars' },
    { name: 'Ardra', ruler: 'Rahu' },
    { name: 'Punarvasu', ruler: 'Jupiter' },
    { name: 'Pushya', ruler: 'Saturn' },
    { name: 'Ashlesha', ruler: 'Mercury' },
    { name: 'Magha', ruler: 'Ketu' },
    { name: 'Purva Phalguni', ruler: 'Venus' },
    { name: 'Uttara Phalguni', ruler: 'Sun' },
    { name: 'Hasta', ruler: 'Moon' },
    { name: 'Chitra', ruler: 'Mars' },
    { name: 'Swati', ruler: 'Rahu' },
    { name: 'Vishakha', ruler: 'Jupiter' },
    { name: 'Anuradha', ruler: 'Saturn' },
    { name: 'Jyeshtha', ruler: 'Mercury' },
    { name: 'Mula', ruler: 'Ketu' },
    { name: 'Purva Ashadha', ruler: 'Venus' },
    { name: 'Uttara Ashadha', ruler: 'Sun' },
    { name: 'Shravana', ruler: 'Moon' },
    { name: 'Dhanishta', ruler: 'Mars' },
    { name: 'Shatabhisha', ruler: 'Rahu' },
    { name: 'Purva Bhadrapada', ruler: 'Jupiter' },
    { name: 'Uttara Bhadrapada', ruler: 'Saturn' },
    { name: 'Revati', ruler: 'Mercury' }
  ];
  
  return {
    name: nakshatras[nakshatraIndex].name,
    index: nakshatraIndex + 1, // 1-27 instead of 0-26
    pada: pada,
    ruler: nakshatras[nakshatraIndex].ruler
  };
}

// Calculate accurate doshas
function calculateAccurateDoshas(planets) {
  // Mangal Dosha (Mars Dosha)
  const mars = planets.find(p => p.name === 'Mars');
  const moon = planets.find(p => p.name === 'Moon');
  
  // More complete Mangal Dosha calculation
  let mangalDosha = false;
  if (mars) {
    // Classic positions for Mangal Dosha
    const dosha_houses = [1, 4, 7, 8, 12];
    
    // Check if Mars is in a dosha house
    mangalDosha = dosha_houses.includes(mars.house);
    
    // Check for mitigations (simplified)
    // When Mars is in its own sign (Aries or Scorpio), dosha is reduced
    if (mangalDosha && (mars.sign === 'Aries' || mars.sign === 'Scorpio')) {
      mangalDosha = false;
    }
    
    // If Mars is with Jupiter or in Jupiter's sign, dosha is reduced
    const jupiter = planets.find(p => p.name === 'Jupiter');
    if (mangalDosha && jupiter && (mars.house === jupiter.house || mars.sign === 'Sagittarius' || mars.sign === 'Pisces')) {
      mangalDosha = false;
    }
  }
  
  // Kaal Sarpa Dosha
  const rahu = planets.find(p => p.name === 'Rahu');
  const ketu = planets.find(p => p.name === 'Ketu');
  
  let kaalSarpaDosha = false;
  let kaalSarpaDosha_type = null;
  
  if (rahu && ketu) {
    // Get all planets except Rahu and Ketu
    const otherPlanets = planets.filter(p => !['Rahu', 'Ketu'].includes(p.name));
    
    // Check if all planets are on one side of the Rahu-Ketu axis
    let allPlanetsBetween = true;
    
    for (const planet of otherPlanets) {
      if (!isLongitudeBetween(planet.longitude, rahu.longitude, ketu.longitude)) {
        allPlanetsBetween = false;
        break;
      }
    }
    
    kaalSarpaDosha = allPlanetsBetween;
    
    // Determine the type of Kaal Sarpa Dosha
    if (kaalSarpaDosha) {
      const signs = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
      ];
      
      const rahuSign = signs.indexOf(rahu.sign);
      const ketuSign = signs.indexOf(ketu.sign);
      
      const kaalSarpaTypes = [
        'Anant', 'Kulik', 'Vasuki', 'Shankhpal', 
        'Padma', 'Mahapadma', 'Takshak', 'Karkotak'
      ];
      
      // Determine the type based on the house position of Rahu
      kaalSarpaDosha_type = kaalSarpaTypes[rahu.house % 8];
    }
  }
  
  // Sade Sati - Saturn's 7.5 year transit around natal Moon
  const saturn = planets.find(p => p.name === 'Saturn');
  let sadeSati = false;
  let sadeSatiPhase = null;
  
  if (saturn && moon) {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    
    const moonSign = signs.indexOf(moon.sign);
    const saturnSign = signs.indexOf(saturn.sign);
    
    // Check if Saturn is in 12th, 1st, or 2nd from natal Moon
    const saturnRelativeToMoon = (saturnSign - moonSign + 12) % 12;
    
    if (saturnRelativeToMoon === 11) { // 12th from Moon
      sadeSati = true;
      sadeSatiPhase = "Beginning Phase";
    } else if (saturnRelativeToMoon === 0) { // Same as Moon
      sadeSati = true;
      sadeSatiPhase = "Peak Phase";
    } else if (saturnRelativeToMoon === 1) { // 2nd from Moon
      sadeSati = true;
      sadeSatiPhase = "Ending Phase";
    }
  }
  
  // Grahan Dosha (Eclipse Dosha)
  const sun = planets.find(p => p.name === 'Sun');
  let grahanDosha = false;
  
  if (sun && moon && rahu && ketu) {
    // Check if Sun is with Rahu or Ketu
    const sunWithRahu = Math.abs(sun.longitude - rahu.longitude) < 10;
    const sunWithKetu = Math.abs(sun.longitude - ketu.longitude) < 10;
    
    // Check if Moon is with Rahu or Ketu
    const moonWithRahu = Math.abs(moon.longitude - rahu.longitude) < 10;
    const moonWithKetu = Math.abs(moon.longitude - ketu.longitude) < 10;
    
    grahanDosha = (sunWithRahu || sunWithKetu) && (moonWithRahu || moonWithKetu);
  }
  
  // Return all doshas
  return {
    mangalDosha,
    kaalSarpaDosha,
    kaalSarpaDosha_type: kaalSarpaDosha ? kaalSarpaDosha_type : null,
    sadeSati,
    sadeSatiPhase,
    grahanDosha
  };
}

// Generate accurate interpretation
function generateAccurateInterpretation(planets, ascendant) {
  // Extract key planets
  const sun = planets.find(p => p.name === 'Sun');
  const moon = planets.find(p => p.name === 'Moon');
  const mars = planets.find(p => p.name === 'Mars');
  const mercury = planets.find(p => p.name === 'Mercury');
  const jupiter = planets.find(p => p.name === 'Jupiter');
  const venus = planets.find(p => p.name === 'Venus');
  const saturn = planets.find(p => p.name === 'Saturn');
  const rahu = planets.find(p => p.name === 'Rahu');
  const ketu = planets.find(p => p.name === 'Ketu');
  
  // Define characteristics of each sign
  const signCharacteristics = {
    'Aries': {
      qualities: 'energetic, confident, and impulsive',
      element: 'Fire',
      ruler: 'Mars',
      positive: 'leadership, courage, enthusiasm',
      negative: 'impatience, aggression, impulsiveness'
    },
    'Taurus': {
      qualities: 'reliable, practical, and stubborn',
      element: 'Earth',
      ruler: 'Venus',
      positive: 'patience, reliability, determination',
      negative: 'possessiveness, stubbornness, resistance to change'
    },
    'Gemini': {
      qualities: 'versatile, curious, and inconsistent',
      element: 'Air',
      ruler: 'Mercury',
      positive: 'adaptability, communication skills, quick-thinking',
      negative: 'nervousness, inconsistency, indecisiveness'
    },
    'Cancer': {
      qualities: 'intuitive, emotional, and protective',
      element: 'Water',
      ruler: 'Moon',
      positive: 'intuition, empathy, tenacity',
      negative: 'moodiness, oversensitivity, clinginess'
    },
    'Leo': {
      qualities: 'dramatic, confident, and generous',
      element: 'Fire',
      ruler: 'Sun',
      positive: 'creativity, generosity, loyalty',
      negative: 'domineering, melodramatic, stubborn'
    },
    'Virgo': {
      qualities: 'analytical, practical, and perfectionist',
      element: 'Earth',
      ruler: 'Mercury',
      positive: 'analytical skills, attention to detail, service-oriented',
      negative: 'critical, obsessive, worrying'
    },
    'Libra': {
      qualities: 'diplomatic, fair-minded, and sociable',
      element: 'Air',
      ruler: 'Venus',
      positive: 'diplomacy, harmony, justice',
      negative: 'indecisiveness, avoidance of confrontation, dependence'
    },
    'Scorpio': {
      qualities: 'passionate, determined, and intense',
      element: 'Water',
      ruler: 'Mars/Pluto',
      positive: 'resourcefulness, passion, loyalty',
      negative: 'jealousy, secretiveness, resentfulness'
    },
    'Sagittarius': {
      qualities: 'optimistic, freedom-loving, and philosophical',
      element: 'Fire',
      ruler: 'Jupiter',
      positive: 'optimism, honesty, adventure',
      negative: 'carelessness, restlessness, overconfidence'
    },
    'Capricorn': {
      qualities: 'disciplined, responsible, and reserved',
      element: 'Earth',
      ruler: 'Saturn',
      positive: 'discipline, responsibility, ambition',
      negative: 'pessimism, rigidity, coldness'
    },
    'Aquarius': {
      qualities: 'independent, humanitarian, and intellectual',
      element: 'Air',
      ruler: 'Saturn/Uranus',
      positive: 'innovation, humanitarianism, independence',
      negative: 'eccentricity, aloofness, rebellion'
    },
    'Pisces': {
      qualities: 'compassionate, intuitive, and dreamy',
      element: 'Water',
      ruler: 'Jupiter/Neptune',
      positive: 'compassion, artistic ability, intuition',
      negative: 'escapism, delusion, self-pity'
    }
  };
  
  // Nakshatra characteristics for Moon's nakshatra - important in Vedic astrology
  const nakshatraCharacteristics = {
    'Ashwini': 'swift, competitive, healing abilities',
    'Bharani': 'transformative, ambitious, bearing burdens',
    'Krittika': 'sharp, focused, passionate about truth',
    'Rohini': 'nurturing, sensual, artistic, growth-oriented',
    'Mrigashira': 'gentle, searching, curious, adaptable',
    'Ardra': 'turbulent, passionate, philosophical',
    'Punarvasu': 'jovial, generous, wise, renewal-oriented',
    'Pushya': 'nourishing, prosperous, protective',
    'Ashlesha': 'mysterious, intuitive, healing, seductive',
    'Magha': 'regal, ambitious, proud, influential',
    'Purva Phalguni': 'playful, creative, indulgent, passionate',
    'Uttara Phalguni': 'diplomatic, balanced, prosperity-oriented',
    'Hasta': 'skilled, practical, detail-oriented',
    'Chitra': 'multi-talented, artistic, bright, charismatic',
    'Swati': 'independent, self-directed, flexible',
    'Vishakha': 'determined, goal-oriented, strategic',
    'Anuradha': 'friendly, harmonious, successful',
    'Jyeshtha': 'courageous, protective, powerful',
    'Mula': 'deep, transformative, searching for roots',
    'Purva Ashadha': 'energetic, invincible, fierce',
    'Uttara Ashadha': 'universally balanced, ethical, expansive',
    'Shravana': 'connected, receptive, learning-oriented',
    'Dhanishta': 'wealthy, musical, swift, generous',
    'Shatabhisha': 'healing, secretive, mystical, innovative',
    'Purva Bhadrapada': 'fiery, intense, transformative',
    'Uttara Bhadrapada': 'balanced, truthful, visionary',
    'Revati': 'prosperous, nurturing, mystical, fulfilled'
  };
  
  // Define house meanings in Vedic astrology
  const houseThemes = {
    1: {
      name: 'Tanu Bhava',
      meaning: 'self-identity, physical appearance, and general well-being',
      governs: 'personality, health, character, and constitution'
    },
    2: {
      name: 'Dhana Bhava',
      meaning: 'finances, personal resources, and speech',
      governs: 'wealth, family, early education, and value system'
    },
    3: {
      name: 'Sahaja Bhava',
      meaning: 'communication, courage, and siblings',
      governs: 'communication skills, short journeys, and immediate environment'
    },
    4: {
      name: 'Sukha Bhava',
      meaning: 'home, mother, emotions, and inner happiness',
      governs: 'domestic environment, property, and psychological foundations'
    },
    5: {
      name: 'Putra Bhava',
      meaning: 'creativity, romance, and children',
      governs: 'intelligence, education, creative expression, and progeny'
    },
    6: {
      name: 'Ari Bhava',
      meaning: 'health, service, and obstacles',
      governs: 'daily routines, illness, enemies, and debts'
    },
    7: {
      name: 'Yuvati Bhava',
      meaning: 'partnerships, marriage, and business relationships',
      governs: 'spouse, contracts, and all one-to-one relationships'
    },
    8: {
      name: 'Randhra Bhava',
      meaning: 'transformation, joint resources, and mysteries',
      governs: 'life changes, occult knowledge, inheritance, and longevity'
    },
    9: {
      name: 'Dharma Bhava',
      meaning: 'higher education, philosophy, and spiritual practice',
      governs: 'religion, ethics, long journeys, and higher purpose'
    },
    10: {
      name: 'Karma Bhava',
      meaning: 'career, public reputation, and authority figures',
      governs: 'profession, social status, and father'
    },
    11: {
      name: 'Labha Bhava',
      meaning: 'friendships, gains, and aspirations',
      governs: 'social groups, income, and fulfillment of desires'
    },
    12: {
      name: 'Vyaya Bhava',
      meaning: 'spirituality, losses, and the subconscious',
      governs: 'seclusion, expenses, foreign places, and spiritual liberation'
    }
  };
  
  // Count planets in each house to find focus areas
  const houseCounts = {};
  planets.forEach(planet => {
    if (planet.house) {
      houseCounts[planet.house] = (houseCounts[planet.house] || 0) + 1;
    }
  });
  
  // Find the top 3 houses with most planets
  const topHouses = Object.entries(houseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => parseInt(entry[0]));
  
  // Generate planetary aspects interpretation
  const aspects = [];
  
  // Check for important conjunctions
  const planetPairs = [
    {pair: [sun, moon], name: 'Sun-Moon', interpretation: 'integration of conscious and unconscious drives'},
    {pair: [sun, mercury], name: 'Sun-Mercury', interpretation: 'intellectual identity and communication'},
    {pair: [venus, mars], name: 'Venus-Mars', interpretation: 'romantic and passionate energies'},
    {pair: [jupiter, saturn], name: 'Jupiter-Saturn', interpretation: 'balance between expansion and limitation'}
  ];
  
  for (const {pair, name, interpretation} of planetPairs) {
    if (pair[0] && pair[1] && pair[0].house === pair[1].house) {
      aspects.push(`The ${name} conjunction suggests ${interpretation}.`);
    }
  }
  
  // Check for important placements
  if (sun && [1, 5, 9, 10].includes(sun.house)) {
    aspects.push(`Sun in ${houseThemes[sun.house].name} indicates strong self-expression through ${houseThemes[sun.house].governs.split(',')[0]}.`);
  }
  
  if (moon && [1, 2, 4, 7].includes(moon.house)) {
    aspects.push(`Moon in ${houseThemes[moon.house].name} shows emotional focus on ${houseThemes[moon.house].governs.split(',')[0]}.`);
  }
  
  // Generate complete interpretation
  const interpretation = {
    personality: `As a ${sun?.sign || 'Unknown'} Sun, you tend to be ${signCharacteristics[sun?.sign]?.qualities || 'balanced and multifaceted'}, with natural ${signCharacteristics[sun?.sign]?.positive || 'versatile qualities'}.`,
    
    emotions: `With Moon in ${moon?.sign || 'Unknown'}, your emotional nature is ${signCharacteristics[moon?.sign]?.qualities || 'balanced and multifaceted'}, showing ${signCharacteristics[moon?.sign]?.positive || 'adaptability'} in feelings and instincts.`,
    
    nakshatra: moon?.nakshatra ? 
      `Your Moon is in ${moon.nakshatra} Nakshatra (pada ${moon.pada}), giving you qualities of being ${nakshatraCharacteristics[moon.nakshatra] || 'adaptive and balanced'}.` : 
      `Moon nakshatra could not be determined.`,
    
    ascendant: `Your Ascendant (Lagna) is ${ascendant || 'Unknown'}, giving you ${signCharacteristics[ascendant]?.qualities || 'balanced and multifaceted'} qualities in how you present yourself to the world.`,
    
    lifeThemes: `The position of planets in your chart suggests focus in the areas of ${topHouses.map(house => houseThemes[house]?.meaning || `house ${house}`).join(', ') || 'various areas of life'}.`,
    
    keyPlanetaryPositions: [
      `Sun in ${sun?.sign || 'Unknown'} (${houseThemes[sun?.house]?.name || 'house'})`,
      `Moon in ${moon?.sign || 'Unknown'} (${houseThemes[moon?.house]?.name || 'house'}) - Nakshatra: ${moon?.nakshatra || 'Unknown'}`,
      `Mercury in ${mercury?.sign || 'Unknown'} (${houseThemes[mercury?.house]?.name || 'house'})`,
      `Venus in ${venus?.sign || 'Unknown'} (${houseThemes[venus?.house]?.name || 'house'})`,
      `Mars in ${mars?.sign || 'Unknown'} (${houseThemes[mars?.house]?.name || 'house'})`,
      `Jupiter in ${jupiter?.sign || 'Unknown'} (${houseThemes[jupiter?.house]?.name || 'house'})`,
      `Saturn in ${saturn?.sign || 'Unknown'} (${houseThemes[saturn?.house]?.name || 'house'})`,
      `Rahu in ${rahu?.sign || 'Unknown'} (${houseThemes[rahu?.house]?.name || 'house'})`,
      `Ketu in ${ketu?.sign || 'Unknown'} (${houseThemes[ketu?.house]?.name || 'house'})`,
    ],
    
    noteableAspects: aspects.length > 0 ? aspects : ["No major aspects of significance were detected."],
    
    dasha: "For accurate Dasha predictions, a professional Vedic astrologer should be consulted. Dasha calculations require exact birth time and additional considerations."
  };
  
  return interpretation;
}

// ---------- ASTRONOMICAL UTILITY FUNCTIONS ----------

// Calculate Julian Day
function calculateJulianDay(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  
  let y = year;
  let m = month;
  
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  
  const jd = Math.floor(365.25 * (y + 4716)) + 
            Math.floor(30.6001 * (m + 1)) + 
            day + b - 1524.5 +
            (hour + minute / 60 + second / 3600) / 24;
            
  return jd;
}

// Calculate Greenwich Sidereal Time
function calculateGreenwichSiderealTime(jd) {
  // Julian centuries since J2000.0
  const t = (jd - 2451545.0) / 36525;
  
  // Mean sidereal time at Greenwich
  let theta = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
              0.000387933 * t * t - t * t * t / 38710000;
  
  // Add nutation correction (simplified)
  // Mean longitude of the ascending node
  const omega = 125.04452 - 1934.136261 * t;
  // Mean longitude of the Sun
  const L = 280.4665 + 36000.7698 * t;
  // Mean longitude of the Moon
  const L1 = 218.3165 + 481267.8813 * t;
  
  // Nutation in longitude (simplified)
  const dpsi = -17.2 * Math.sin(omega * Math.PI / 180) - 1.32 * Math.sin(2 * L * Math.PI / 180) - 0.23 * Math.sin(2 * L1 * Math.PI / 180);
  
  // Mean obliquity of the ecliptic
  const epsilon = 23.439291 - 0.0130042 * t - 0.00000016 * t * t + 0.000000504 * t * t * t;
  
  // Nutation correction to GST
  theta += dpsi * Math.cos(epsilon * Math.PI / 180) / 15;
  
  // Ensure the result is in the range 0-360 before converting to hours
  theta = theta % 360;
  if (theta < 0) theta += 360;
  
  // Convert to hours
  theta = theta / 15;
  
  // Ensure the result is in the range 0-24
  theta = theta % 24;
  if (theta < 0) theta += 24;
  
  return theta;
}

// Calculate Lahiri Ayanamsa with higher accuracy
function calculateLahiriAyanamsa(jd) {
  // Julian day for the beginning of Kali Yuga (according to Lahiri)
  const jd_kali_yuga_start = 588465.5;
  
  // Julian centuries since the beginning of Kali Yuga
  const t = (jd - jd_kali_yuga_start) / 36525;
  
  // More accurate formula for Lahiri ayanamsa
  // The reference point is 23°15'00" at 21 March 1956, 00:00 UTC
  const jd_reference = 2435553.5;
  const ayanamsa_reference = 23.15;
  
  // The ayanamsa at the reference date plus the precession since
  const precession_rate = 50.288;  // arcseconds per year
  const years_since_reference = (jd - jd_reference) / 365.25;
  const ayanamsa = ayanamsa_reference + (precession_rate * years_since_reference) / 3600;
  
  return ayanamsa;
}

// Calculate Sun longitude (simplified)
function calculateSunLongitude(jd) {
  // More accurate implementation based on VSOP87 theory
  // Julian centuries since J2000.0
  const t = (jd - 2451545.0) / 36525;
  
  // Sun's mean longitude
  let L0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  
  // Sun's mean anomaly
  const M = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const M_rad = M * Math.PI / 180;
  
  // Eccentricity of Earth's orbit
  const e = 0.016708634 - 0.000042037 * t - 0.0000000283 * t * t;
  
  // Equation of center - more accurate formula with additional terms
  const C = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(M_rad) +
            (0.019993 - 0.000101 * t) * Math.sin(2 * M_rad) +
            0.000289 * Math.sin(3 * M_rad);
  
  // Sun's true longitude
  const L_true = L0 + C;
  
  // Sun's apparent longitude (corrected for aberration)
  const omega = 125.04 - 1934.136 * t;
  const L_apparent = L_true - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
  
  // Ensure the result is in the range 0-360
  const longitude = L_apparent % 360;
  return longitude < 0 ? longitude + 360 : longitude;
}

// Calculate Moon longitude (more accurate)
function calculateMoonLongitude(jd) {
  // More accurate formula based on ELP-2000/82 theory
  // Julian centuries since J2000.0
  const t = (jd - 2451545.0) / 36525;
  
  // Moon's mean longitude
  let L = 218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t * t * t / 538841 - t * t * t * t / 65194000;
  
  // Moon's mean anomaly
  const M = 134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t * t * t / 69699 - t * t * t * t / 14712000;
  
  // Moon's argument of latitude
  const F = 93.2720950 + 483202.0175233 * t - 0.0036539 * t * t - t * t * t / 3526000 + t * t * t * t / 863310000;
  
  // Sun's mean anomaly
  const MS = 357.5291092 + 35999.0502909 * t - 0.0001536 * t * t + t * t * t / 24490000;
  
  // Moon's mean elongation from the Sun
  const D = 297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t * t * t / 545868 - t * t * t * t / 113065000;
  
  // Convert to radians
  const M_rad = M * Math.PI / 180;
  const MS_rad = MS * Math.PI / 180;
  const F_rad = F * Math.PI / 180;
  const D_rad = D * Math.PI / 180;
  
  // More comprehensive perturbations with additional terms
  let DL = 6.288774 * Math.sin(M_rad) +
           1.274027 * Math.sin(2 * D_rad - M_rad) +
           0.658314 * Math.sin(2 * D_rad) +
           0.213618 * Math.sin(2 * M_rad) +
           -0.185116 * Math.sin(MS_rad) +
           -0.114332 * Math.sin(2 * F_rad) +
           0.058793 * Math.sin(2 * D_rad - 2 * M_rad) +
           0.057066 * Math.sin(2 * D_rad - MS_rad - M_rad) +
           0.053322 * Math.sin(2 * D_rad + M_rad) +
           0.045758 * Math.sin(2 * D_rad - MS_rad) +
           -0.040923 * Math.sin(MS_rad - M_rad) +
           -0.034720 * Math.sin(D_rad) +
           -0.030383 * Math.sin(MS_rad + M_rad);
  
  // Additional higher precision terms could be added here
  
  // True longitude
  let longitude = L + DL;
  
  // Ensure the result is in the range 0-360
  longitude = longitude % 360;
  if (longitude < 0) longitude += 360;
  
  return longitude;
}

// Calculate Node longitude with higher accuracy
function calculateNodeLongitude(jd) {
  // Higher accuracy formula for the lunar node
  // Julian centuries since J2000.0
  const t = (jd - 2451545.0) / 36525;
  
  // Mean longitude of the ascending node with additional terms
  let omega = 125.04452 - 1934.136261 * t + 0.0020708 * t * t + t * t * t / 450000;
  
  // Apply nutation correction (simplified)
  const L = 280.4665 + 36000.7698 * t; // Sun's mean longitude
  const L1 = 218.3165 + 481267.8813 * t; // Moon's mean longitude
  const nutation = -17.2 * Math.sin(omega * Math.PI / 180) - 1.32 * Math.sin(2 * L * Math.PI / 180) - 0.23 * Math.sin(2 * L1 * Math.PI / 180);
  
  omega += nutation / 3600; // Convert arcseconds to degrees
  
  // Ensure the result is in the range 0-360
  omega = omega % 360;
  if (omega < 0) omega += 360;
  
  return omega;
}

// Calculate planet longitude with higher accuracy
function calculatePlanetLongitude(planet, jd) {
  // Higher accuracy implementations based on VSOP87 theory
  // These are still simplified compared to full implementations
  // which use thousands of periodic terms
  
  // Julian centuries since J2000.0
  const t = (jd - 2451545.0) / 36525;
  
  // Planet-specific calculations
  switch (planet.toLowerCase()) {
    case 'mercury': {
      // Mercury's elements
      const L = 252.250906 + 149472.6746358 * t; // Mean longitude
      const M = 48.33076593 + 149472.67486623 * t; // Mean anomaly
      const e = 0.20563175 + 0.000020407 * t - 0.0000000283 * t * t; // Eccentricity
      const Pi = 77.45611904 + 0.16047689 * t - 0.00004976 * t * t; // Longitude of perihelion
      
      // Convert to radians
      const M_rad = M * Math.PI / 180;
      
      // Equation of center (simplified version)
      const C = (2 * e - 0.25 * e * e * e) * Math.sin(M_rad) +
                1.25 * e * e * Math.sin(2 * M_rad) +
                1.08333 * e * e * e * Math.sin(3 * M_rad);
      
      // True longitude
      let longitude = L + C;
      
      // Ensure the result is in the range 0-360
      longitude = longitude % 360;
      if (longitude < 0) longitude += 360;
      
      return longitude;
    }
    
    case 'venus': {
      // Venus's elements
      const L = 181.979801 + 58517.8156760 * t; // Mean longitude
      const M = 212.60322776 + 58517.80387664 * t; // Mean anomaly
      const e = 0.00677192 - 0.000047765 * t + 0.0000000981 * t * t; // Eccentricity
      const Pi = 131.56370300 + 0.00000010 * t - 0.00000001 * t * t; // Longitude of perihelion
      
      // Convert to radians
      const M_rad = M * Math.PI / 180;
      
      // Equation of center
      const C = (2 * e - 0.25 * e * e * e) * Math.sin(M_rad) +
                1.25 * e * e * Math.sin(2 * M_rad) +
                1.08333 * e * e * e * Math.sin(3 * M_rad);
      
      // True longitude
      let longitude = L + C;
      
      // Ensure the result is in the range 0-360
      longitude = longitude % 360;
      if (longitude < 0) longitude += 360;
      
      return longitude;
    }
    
    case 'mars': {
      // Mars's elements
      const L = 355.433000 + 19140.2993039 * t; // Mean longitude
      const M = 319.51913365 + 19139.85475499 * t; // Mean anomaly
      const e = 0.09340065 + 0.000090484 * t - 0.0000000806 * t * t; // Eccentricity
      const Pi = 336.04084100 + 0.44020758 * t - 0.00000038 * t * t; // Longitude of perihelion
      
      // Convert to radians
      const M_rad = M * Math.PI / 180;
      
      // Equation of center
      const C = (2 * e - 0.25 * e * e * e) * Math.sin(M_rad) +
                1.25 * e * e * Math.sin(2 * M_rad) +
                1.08333 * e * e * e * Math.sin(3 * M_rad);
      
      // True longitude
      let longitude = L + C;
      
      // Ensure the result is in the range 0-360
      longitude = longitude % 360;
      if (longitude < 0) longitude += 360;
      
      return longitude;
    }
    
    case 'jupiter': {
      // Jupiter's elements
      const L = 34.351519 + 3034.9056606 * t; // Mean longitude
      const M = 225.32833132 + 3034.69202376 * t; // Mean anomaly
      const e = 0.04849793 + 0.000163225 * t - 0.0000004714 * t * t; // Eccentricity
      const Pi = 14.33120687 + 0.21252668 * t + 0.00000208 * t * t; // Longitude of perihelion
      
      // Convert to radians
      const M_rad = M * Math.PI / 180;
      
      // Equation of center
      const C = (2 * e - 0.25 * e * e * e) * Math.sin(M_rad) +
                1.25 * e * e * Math.sin(2 * M_rad) +
                1.08333 * e * e * e * Math.sin(3 * M_rad);
      
      // True longitude
      let longitude = L + C;
      
      // Additional perturbations due to Saturn
      const MS = 357.5291092 + 35999.0502909 * t; // Sun's mean anomaly
      const MJ = M; // Jupiter's mean anomaly
      const MS_rad = MS * Math.PI / 180;
      
      // Jupiter-Saturn perturbation (simplified)
      const P_JS = 0.332 * Math.sin((2 * MJ - 5 * MS - 67.6) * Math.PI / 180);
      
      longitude += P_JS;
      
      // Ensure the result is in the range 0-360
      longitude = longitude % 360;
      if (longitude < 0) longitude += 360;
      
      return longitude;
    }
    
    case 'saturn': {
      // Saturn's elements
      const L = 50.077444 + 1222.1138488 * t; // Mean longitude
      const M = 175.46622542 + 1221.55147488 * t; // Mean anomaly
      const e = 0.05550825 - 0.000346818 * t - 0.0000006456 * t * t; // Eccentricity
      const Pi = 92.43194399 + 0.54179478 * t - 0.00000037 * t * t; // Longitude of perihelion
      
      // Convert to radians
      const M_rad = M * Math.PI / 180;
      
      // Equation of center
      const C = (2 * e - 0.25 * e * e * e) * Math.sin(M_rad) +
                1.25 * e * e * Math.sin(2 * M_rad) +
                1.08333 * e * e * e * Math.sin(3 * M_rad);
      
      // True longitude
      let longitude = L + C;
      
      // Additional perturbations due to Jupiter
      const MJ = 225.32833132 + 3034.69202376 * t; // Jupiter's mean anomaly
      const MS = M; // Saturn's mean anomaly
      const MJ_rad = MJ * Math.PI / 180;
      
      // Jupiter-Saturn perturbation (simplified)
      const P_SJ = 0.812 * Math.sin((2 * MJ - 5 * MS - 33.2) * Math.PI / 180);
      
      longitude += P_SJ;
      
      // Ensure the result is in the range 0-360
      longitude = longitude % 360;
      if (longitude < 0) longitude += 360;
      
      return longitude;
    }
    
    default:
      // Return 0 for unknown planets
      return 0;
  }
}

// Helper function to determine which sign a longitude falls in
function getSignFromLongitude(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  const signIndex = Math.floor(longitude / 30);
  return signs[signIndex];
}

// Helper function to find which house a planet is in
function findHouseForLongitude(longitude, houses) {
  // In Vedic astrology, houses align with signs
  // So we find which house contains the sign of this longitude
  const sign = getSignFromLongitude(longitude);
  
  for (let i = 0; i < houses.length; i++) {
    if (houses[i].sign === sign) {
      return houses[i].house;
    }
  }
  
  return 1; // Default to first house if not found
}

// Helper function to check if a longitude is between two other longitudes
function isLongitudeBetween(longitude, start, end) {
  // Normalize angles to 0-360 range
  longitude = (longitude + 360) % 360;
  start = (start + 360) % 360;
  end = (end + 360) % 360;
  
  // If the interval crosses the 0/360 boundary
  if (start > end) {
    return longitude >= start || longitude <= end;
  }
  
  // Normal interval
  return longitude >= start && longitude <= end;
}