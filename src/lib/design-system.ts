// Design System Constants
// Comprehensive design tokens for DJBUILDIT Personal Website
// Following mobile-first responsive design principles

export const COLORS = {
  // Brand Colors
  brand: {
    primary: 'from-purple-400 via-pink-500 to-red-500',
    secondary: 'from-blue-400 to-cyan-400',
    accent: 'from-emerald-400 to-teal-400',
  },
  
  // Service Colors
  fitness: {
    primary: 'text-emerald-400',
    gradient: 'from-emerald-400 to-teal-400',
    border: 'border-emerald-400',

    
    alternatives: {
      phthalo: 'from-green-900 to-emerald-700',
      hunter: 'from-green-800 to-green-600', 
      forest: 'from-emerald-800 to-teal-600',
      military: 'from-green-900 to-teal-700',
      alpine: 'from-slate-700 to-green-700',
    },
  },
  
  finance: {
    primary: 'text-blue-400',
    gradient: 'from-blue-400 to-cyan-400',
    border: 'border-blue-400',
  },
  
  apps: {
    primary: 'text-purple-400',
    gradient: 'from-purple-400 via-pink-500 to-red-500',
    border: 'border-purple-400',
  },
  
  // Glass Morphism
  glass: {
    base: 'bg-white/10 backdrop-blur-sm border border-white/20',
    hover: 'hover:bg-white/20',
    strong: 'bg-white/15 backdrop-blur-md border border-white/30',
  },
  
  // Text Colors
  text: {
    primary: 'text-white',
    secondary: 'text-white/90',
    muted: 'text-white/70',
    accent: 'text-white/80',
    brand: 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent',
  },
  
  // Background Overlays
  overlay: {
    light: 'bg-gradient-to-r from-black/70 via-black/50 to-black/30',
    medium: 'bg-gradient-to-r from-black/80 via-black/60 to-black/40',
    strong: 'bg-gradient-to-r from-black/85 via-black/70 to-black/50',
  },
} as const;

export const TYPOGRAPHY = {
  // Responsive Hero Typography
  hero: {
    primary: 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-light uppercase leading-[0.8] tracking-[0.05em]',
    // 30% smaller compact version for homepage
    compact: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light uppercase leading-[0.8] tracking-[0.05em]',
    secondary: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light uppercase leading-[0.9] tracking-[0.1em]',
    tertiary: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light uppercase leading-[0.9] tracking-[0.1em]',
  },
  
  // Section Headers
  section: {
    primary: 'text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-[0.15em]',
    secondary: 'text-lg sm:text-xl md:text-2xl font-normal uppercase tracking-[0.1em]',
  },
  
  // Body Text
  body: {
    large: 'text-base sm:text-lg leading-relaxed font-extralight',
    regular: 'text-sm sm:text-base leading-relaxed font-extralight',
    small: 'text-xs sm:text-sm leading-relaxed font-extralight',
  },
  
  // Labels and Navigation
  label: {
    primary: 'text-base sm:text-lg font-normal uppercase tracking-[0.1em]',
    secondary: 'text-sm sm:text-base font-normal uppercase tracking-[0.1em]',
    small: 'text-xs sm:text-sm font-normal uppercase tracking-[0.1em]',
  },
  
  // Spacing
  spacing: {
    hero: 'mb-4 sm:mb-6 md:mb-8',
    section: 'mb-6 sm:mb-8 md:mb-12',
    paragraph: 'mb-4 sm:mb-6',
    tight: 'mb-2 sm:mb-3',
  },
} as const;

export const LAYOUT = {
  // Container Patterns
  container: 'px-6 sm:px-8 md:px-12 lg:px-20 xl:px-24',
  containerTight: 'px-4 sm:px-6 md:px-8 lg:px-12',
  containerWide: 'px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32',
  
  // Grid Systems
  grid: {
    main: 'grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12',
    apps: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6',
    content: 'grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12',
  },
  
  // Column Spans
  columns: {
    hero: 'lg:col-span-3 lg:col-start-1',           // Optimal text readability (3 columns)
    content: 'lg:col-span-6 lg:col-start-5',  // Main visual content (6 columns starting at 5)
    contentNarrow: 'lg:col-span-3 lg:col-start-10', // Secondary content (3 columns starting at 10)
    sidebar: 'lg:col-span-4',
    main: 'lg:col-span-8',
  },
  
  // Spacing
  spacing: {
    section: 'py-12 sm:py-16 md:py-20 lg:py-24',
    sectionSmall: 'py-8 sm:py-12 md:py-16',
    element: 'mb-8 sm:mb-12 md:mb-16',
    elementSmall: 'mb-4 sm:mb-6 md:mb-8',
  },
  
  // Glass Components
  glass: 'bg-white/15 backdrop-blur-md border border-white/20 rounded-lg',
  glassHover: 'hover:bg-white/25 hover:scale-[1.02] transition-all duration-300',
  
  // Heights - Updated with proper responsive calculations using modern viewport units
  height: {
    screen: 'min-h-screen',
    hero: 'min-h-[100vh] lg:min-h-[90vh]',
    section: 'min-h-[60vh] lg:min-h-[70vh]',
    // Mobile-first responsive content heights - updated for smaller header/footer
    contentScreen: 'min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-7rem)] md:min-h-[calc(100dvh-8rem)]',
    contentHero: 'min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-7rem)] md:min-h-[calc(100dvh-8rem)]',
    contentSection: 'min-h-[calc(100dvh-8rem)] sm:min-h-[calc(100dvh-8rem)] md:min-h-[calc(100dvh-9rem)]',
    // Safe area variants for iOS devices with notches
    contentScreenSafe: 'min-h-[calc(100dvh-7rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:min-h-[calc(100dvh-7rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:min-h-[calc(100dvh-8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]',
  },
} as const;

export const ANIMATIONS = {
  // Timing Functions
  timing: {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500',
    slower: 'duration-700',
    slowest: 'duration-1000',
  },
  
  // Common Transitions
  transition: {
    all: 'transition-all duration-300 ease-in-out',
    transform: 'transition-transform duration-300 ease-in-out',
    colors: 'transition-colors duration-300 ease-in-out',
    opacity: 'transition-opacity duration-300 ease-in-out',
  },
  
  // Hover Effects
  hover: {
    scale: 'hover:scale-105',
    scaleSmall: 'hover:scale-[1.02]',
    lift: 'hover:-translate-y-1',
    glow: 'hover:shadow-lg hover:shadow-white/20',
  },
  
  // Loading States
  loading: {
    fadeIn: 'opacity-0 translate-y-8',
    fadeInActive: 'opacity-100 translate-y-0',
    slideUp: 'transform translate-y-full',
    slideUpActive: 'transform translate-y-0',
  },
} as const;

export const BACKGROUND_IMAGES = {
  home: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  apps: '/images/Kenai Website.png',
  finance: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  fitness: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  contact: '/images/mehardingicefield1.png',
  store: '/images/denali3.png',
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const TOUCH_TARGETS = {
  minimum: 'min-h-[44px] min-w-[44px]',
  comfortable: 'min-h-[48px] min-w-[48px]',
  large: 'min-h-[56px] min-w-[56px]',
} as const;

// Component Patterns
export const COMPONENT_PATTERNS = {
  button: {
    primary: `${LAYOUT.glass} ${COLORS.glass.hover} ${TYPOGRAPHY.label.secondary} ${COLORS.text.primary} px-6 py-3 rounded-md ${ANIMATIONS.transition.all} group ${TOUCH_TARGETS.comfortable}`,
    secondary: `${COLORS.glass.base} ${COLORS.glass.hover} ${TYPOGRAPHY.label.small} ${COLORS.text.muted} px-4 py-2 rounded-md ${ANIMATIONS.transition.all} ${TOUCH_TARGETS.minimum}`,
  },
  
  card: {
    base: `${LAYOUT.glass} p-6 sm:p-8 ${LAYOUT.glassHover}`,
    compact: `${LAYOUT.glass} p-4 sm:p-6 ${LAYOUT.glassHover}`,
  },
  
  input: {
    base: `${LAYOUT.glass} ${COLORS.text.primary} px-4 py-3 rounded-md ${ANIMATIONS.transition.all} focus:outline-none focus:ring-2 focus:ring-white/30 ${TOUCH_TARGETS.comfortable}`,
  },
} as const;

// Service-specific configurations
export const SERVICES = {
  fitness: {
    color: COLORS.fitness,
    icon: 'Dumbbell',
    background: BACKGROUND_IMAGES.fitness,
  },
  finance: {
    color: COLORS.finance,
    icon: 'TrendingUp',
    background: BACKGROUND_IMAGES.finance,
  },
  apps: {
    color: COLORS.apps,
    icon: 'Code',
    background: BACKGROUND_IMAGES.apps,
  },
} as const;

// Mobile-specific layout helpers
export const MOBILE_LAYOUT = {
  // Header heights for accurate calculations - updated for 60% smaller header
  headerHeight: {
    mobile: '3.5rem',    // ~56px - p-2 + content + p-2
    tablet: '3.5rem',    // ~56px - p-2 + content + p-2  
    desktop: '4rem',     // ~64px - p-3 + content + p-3
  },
  
  // Footer heights for accurate calculations - updated for 50% smaller footer
  footerHeight: {
    mobile: '2.5rem',    // ~40px - p-2 + content + p-2
    tablet: '3rem',      // ~48px - p-3 + content + p-3
    desktop: '3.5rem',   // ~56px - p-4 + content + p-4  
  },
  
  // Safe spacing for mobile devices
  safeContainer: 'px-4 sm:px-6 md:px-8 lg:px-20 xl:px-24 pb-safe-area',
  
  // Touch-friendly spacing that meets accessibility guidelines
  touchPadding: 'p-4 sm:p-6 md:p-8',
  touchMargin: 'm-4 sm:m-6 md:m-8',
  
  // Mobile navigation specific
  mobileNav: {
    overlay: 'fixed inset-0 z-40 md:hidden',
    backdrop: 'absolute inset-0 bg-black/50 backdrop-blur-sm',
    menu: 'absolute top-16 left-0 right-0 bg-black/90 backdrop-blur-md border-b border-white/10',
    item: 'py-3 border-b border-white/10 last:border-b-0',
  },
} as const; 