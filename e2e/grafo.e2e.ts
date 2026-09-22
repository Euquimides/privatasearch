import { test, expect } from '@playwright/test';

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop'));

test('la red de citas carga sin errores de consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/grafo/');
    await expect(page.getByLabel('Buscar resoluciones en el grafo')).toBeVisible();
    expect(errors).toEqual([]);
});

test('buscar en el grafo muestra el conteo de coincidencias', async ({ page }) => {
    await page.goto('/grafo/');
    const input = page.getByLabel('Buscar resoluciones en el grafo');
    await input.fill('consentimiento');
    await expect(page.getByText(/resoluci(ó|o)n(es)? encontrada|Sin coincidencias/)).toBeVisible();
});

test('limpiar la búsqueda del grafo vacía el campo', async ({ page }) => {
    await page.goto('/grafo/');
    const input = page.getByLabel('Buscar resoluciones en el grafo');
    await input.fill('consentimiento');
    await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
    await expect(input).toHaveValue('');
});
