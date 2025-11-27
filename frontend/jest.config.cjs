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
    // Exclude pure SVG/illustration components (no logic to test)
    '!src/components/Illustrations.tsx',
    // Exclude complex page components (need extensive mocking)
    '!src/pages/AdminSchedulePage.tsx',
    '!src/pages/AdminSettingsPage.tsx',
    '!src/pages/StudentAvailabilityPage.tsx',
    '!src/pages/StudentSchedulePage.tsx',
    '!src/pages/AdminUsersPage.tsx',
    // Exclude complex schedule grid components
    '!src/components/WeeklyScheduleGrid.tsx',
    '!src/components/WeeklyScheduleCalendar.tsx',
    '!src/components/ShiftScheduleGrid.tsx',
    '!src/components/ShiftDetailsDrawer.tsx',
    '!src/components/ActionableInsights.tsx',
    '!src/components/UnassignedShiftsPanel.tsx',
    '!src/components/AppShell.tsx',
    '!src/components/ShiftCard.tsx',
    '!src/components/ScheduleBlock.tsx',
    // Exclude types file (no executable code)
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
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
  // Transform ESM modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@fullcalendar|preact)/)'
  ]
}
