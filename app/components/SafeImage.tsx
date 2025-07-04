'use client';

import OptimizedImage from './OptimizedImage';

// SafeImage is an alias for OptimizedImage
// This component exists to maintain backward compatibility
// and prevent HMR errors when SafeImage is imported
const SafeImage = OptimizedImage;

export default SafeImage; 