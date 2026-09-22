import { test, expect } from '@playwright/test';

// El panel de filtros solo se renderiza en el DOM en su variante de escritorio
// cuando el viewport es angosto (la variante móvil requiere expandirla primero
// y duplicaría los mismos controles en el árbol de accesibilidad).
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop'));

test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('alternar un resultado lo activa y "Limpiar" lo quita', async ({ page }) => {
    const boton = page.getByRole('button', { name: 'Con lugar', exact: true });
    await expect(boton).toHaveAttribute('aria-pressed', 'false');

    await boton.click();
    await expect(boton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/resoluci(ó|o)n(es)? con los filtros/)).toBeVisible();

    await page.getByRole('button', { name: 'Limpiar' }).click();
    await expect(boton).toHaveAttribute('aria-pressed', 'false');
});

test('alternar un tipo de procedimiento filtra los resultados', async ({ page }) => {
    const boton = page.getByRole('button', { name: 'Denuncia', exact: true });
    await boton.click();
    await expect(boton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/resoluci(ó|o)n(es)? con los filtros/)).toBeVisible();
});

test('cambiar "Por página" cambia el límite mostrado', async ({ page }) => {
    const select = page.locator('#result-limit');
    await select.selectOption('20');
    await expect(select).toHaveValue('20');
});

test('el slider de precisión actualiza el porcentaje mostrado', async ({ page }) => {
    const slider = page.locator('#similarity-threshold');
    await slider.fill('80');
    await expect(page.getByText('80%')).toBeVisible();
});

test('alternar el switch de resaltado cambia su estado', async ({ page }) => {
    const interruptor = page.getByRole('switch');
    await expect(interruptor).toHaveAttribute('aria-checked', 'true');
    await interruptor.click();
    await expect(interruptor).toHaveAttribute('aria-checked', 'false');
});

test('un rango de año filtra y "Limpiar" lo resetea', async ({ page }) => {
    const desde = page.locator('#year-from');
    const opciones = await desde.locator('option').allTextContents();
    const primerAnio = opciones.find((o) => o.trim() !== 'Desde…');
    test.skip(!primerAnio, 'no hay años disponibles en el índice');

    await desde.selectOption({ label: primerAnio! });
    await expect(page.getByText(/resoluci(ó|o)n(es)? con los filtros/)).toBeVisible();

    await page.getByRole('button', { name: 'Limpiar' }).click();
    await expect(desde).toHaveValue('');
});
