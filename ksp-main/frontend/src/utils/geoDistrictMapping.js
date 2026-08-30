/**
 * Maps legacy census district names from Karnataka_District_Boundary.json
 * to the modern standardized naming used in the KSP Drishti application.
 */
export const GEOJSON_TO_APP_DISTRICTS = {
  "Bangalore": "Bengaluru Urban",
  "Bangalore Rural": "Bengaluru Rural",
  "Gulbarga": "Kalaburagi District",
  "Belgaum": "Belagavi District",
  "Bijapur": "Vijayapura",
  "Bellary": "Ballari",
  "Tumkur": "Tumakuru",
  "Shimoga": "Shivamogga",
  "Mysore": "Mysuru City",
  "Chamrajnagar": "Chamarajanagara",
  "Chikmagalur": "Chikkamagaluru",
  "Bagalkot": "Bagalkote"
};

/**
 * Some Sub-divisions (Districts in our app) share the exact same geographical boundary
 * from the GeoJSON because they were recently split or represent a specific police district
 * inside a larger revenue district (e.g., KGF is inside Kolar).
 * This map dictates which GeoJSON geometry (by its normalized name) should be duplicated 
 * to represent the child alias district.
 */
export const SUBUNIT_ALIASES = {
  // GeoJSON normalized base name -> Array of new aliases to clone geometry for
  "Kolar": ["Kolar Gold Fields (KGF)"],
  "Ballari": ["Vijayanagara"]
};

/**
 * Organizes the 4 main division commands and their official subdivisions.
 * Used for filtering boundaries and validating state.
 */
export const DIVISION_SUBDIVISIONS = {
  bengaluru: [
    "Bengaluru Urban", "Bengaluru Rural", "Chikkaballapura", "Chitradurga",
    "Davanagere", "Kolar", "Kolar Gold Fields (KGF)", "Ramanagara", "Tumakuru"
  ],
  mysuru: [
    "Chamarajanagara", "Chikkamagaluru", "Dakshina Kannada", "Hassan",
    "Kodagu", "Mandya", "Mysuru City", "Udupi"
  ],
  belagavi: [
    "Bagalkote", "Belagavi District", "Dharwad", "Gadag", "Haveri", 
    "Uttara Kannada", "Vijayapura"
  ],
  kalaburagi: [
    "Ballari", "Bidar", "Kalaburagi District", "Koppal", "Raichur", 
    "Vijayanagara", "Yadgir"
  ]
};

/**
 * Helper to process the raw GeoJSON into a filtered set for the active division,
 * including cloning geometries for sub-unit aliases.
 */
export function processDivisionGeoJSON(rawGeoJson, divisionKey) {
  if (!rawGeoJson || !rawGeoJson.features || !divisionKey) return null;

  const validSubdivisions = DIVISION_SUBDIVISIONS[divisionKey.toLowerCase()] || [];
  const processedFeatures = [];

  rawGeoJson.features.forEach(feature => {
    const rawName = feature.properties.district;
    const normalizedName = GEOJSON_TO_APP_DISTRICTS[rawName] || rawName;

    // 1. If the base normalized district is in this division, add it.
    if (validSubdivisions.includes(normalizedName)) {
      // Clone the feature so we don't mutate the raw state cache directly
      const featureClone = JSON.parse(JSON.stringify(feature));
      featureClone.properties.normalized_district = normalizedName;
      processedFeatures.push(featureClone);
    }

    // 2. Check if this geometry should be cloned for sub-unit aliases (e.g. KGF, Vijayanagara)
    if (SUBUNIT_ALIASES[normalizedName]) {
      SUBUNIT_ALIASES[normalizedName].forEach(alias => {
        if (validSubdivisions.includes(alias)) {
          const aliasClone = JSON.parse(JSON.stringify(feature));
          aliasClone.properties.normalized_district = alias;
          processedFeatures.push(aliasClone);
        }
      });
    }
  });

  return { type: "FeatureCollection", features: processedFeatures };
}
