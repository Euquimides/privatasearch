import { test, expect } from '@playwright/test';

const RUTAS = ['/', '/estadisticas/', '/grafo/', '/disclaimer/', '/formularios/',
    '/formularios/personas-fisicas/', '/formularios/personas-juridicas/', '/formularios/organismos-publicos/'];
const MIN_TACTIL = 24; // WCAG 2.2 AA (2.5.8); el ideal de Apple/Google es 44

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'mobile'));

for (const ruta of RUTAS) {
    test(`sin overflow horizontal: ${ruta}`, async ({ page }) => {
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        const { scroll, ancho } = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth, ancho: window.innerWidth,
        }));
        expect(scroll, `scrollWidth ${scroll} > viewport ${ancho}`).toBeLessThanOrEqual(ancho);
    });

    test(`áreas táctiles >= ${MIN_TACTIL}px: ${ruta}`, async ({ page }) => {
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        const chicos = await page.evaluate((min) =>
            [...document.querySelectorAll<HTMLElement>('button, a[href], input:not([type=hidden]), select, textarea, [role=button]')]
                .filter((el) => !el.closest('canvas') && !el.matches('a[href^="#"]') && el.getClientRects().length) // skip links: solo visibles con foco
                .map((el) => ({ el, r: (el.closest('label') ?? el).getBoundingClientRect() })) // checkbox/radio: cuenta el <label> que los envuelve
                .filter(({ r }) => (r.width < min || r.height < min))
                .map(({ el, r }) => `${el.tagName} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`),
            MIN_TACTIL);
        expect(chicos).toEqual([]);
    });
}

test('flujo de búsqueda: consultar, abrir resultado y cerrar', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Buscar resoluciones');
    await input.fill('consentimiento');

    const resultados = page.getByRole('button', { name: /^Abrir resolución:/ });
    await expect(resultados.first()).toBeVisible();

    // el campo no debe quedar fuera de pantalla tras buscar
    const box = await input.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);

    await resultados.first().tap();
    const cerrar = page.getByRole('button', { name: 'Cerrar' });
    await expect(cerrar).toBeVisible();
    await cerrar.tap();
    await expect(cerrar).toBeHidden();
});

test('limpiar búsqueda vacía el campo', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Buscar resoluciones');
    await input.fill('datos');
    await page.getByRole('button', { name: 'Limpiar búsqueda' }).tap();
    await expect(input).toHaveValue('');
});

test('botones de las tarjetas de resultados >= 44px', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Buscar resoluciones').fill('consentimiento');
    const tarjeta = page.getByRole('button', { name: /^Abrir resolución:/ }).first();
    await expect(tarjeta).toBeVisible();
    for (const el of await tarjeta.locator('button, a[href]').all()) {
        const b = (await el.boundingBox())!;
        expect(b.height, await el.innerHTML()).toBeGreaterThanOrEqual(44);
        expect(b.width).toBeGreaterThanOrEqual(44);
    }
});
