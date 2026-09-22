import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: 'e2e',
    testMatch: '*.e2e.ts', // evita que vitest los recoja
    use: { baseURL: 'http://localhost:3100', trace: 'on-first-retry' },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ],
    // Sirve el export estático (`npm run build` antes)
    webServer: {
        command: 'node -e "require(\'http\').createServer((q,s)=>require(\'serve-handler\')(q,s,{public:\'out\',trailingSlash:true})).listen(3100)"',
        url: 'http://localhost:3100',
        reuseExistingServer: true,
    },
});
