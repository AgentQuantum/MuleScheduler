module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/?(*.)+(spec|test).{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/setupTests.ts',
    '!src/App.tsx',
    // Exclude pure SVG/illustration components
    '!src/components/Illustrations.tsx',
    // Exclude all pages (need integration testing)
    '!src/pages/**',
    // Exclude complex schedule components
    '!src/components/WeeklyScheduleGrid.tsx',
    '!src/components/WeeklyScheduleCalendar.tsx',
    '!src/components/ShiftScheduleGrid.tsx',
    '!src/components/ShiftDetailsDrawer.tsx',
    '!src/components/ActionableInsights.tsx',
    '!src/components/UnassignedShiftsPanel.tsx',
    '!src/components/AppShell.tsx',
    '!src/components/ShiftCard.tsx',
    '!src/components/ScheduleBlock.tsx',
    '!src/components/Navbar.tsx',
    // Exclude types
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: false
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: [
    'node_modules/(?!(@fullcalendar|preact)/)'
  ]
}
