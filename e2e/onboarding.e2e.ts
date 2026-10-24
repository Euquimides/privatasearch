import { test, expect, type Page } from '@playwright/test';

const tooltip = (page: Page) => page.locator('.react-joyride__tooltip');

/** Recorre el tour hasta "Listo" y devuelve los títulos que mostró. */
async function recorrer(page: Page) {
    const titulos: string[] = [];
    await expect(tooltip(page)).toBeVisible();
    for (let i = 0; i < 10; i++) {
        titulos.push((await tooltip(page).locator('h1, h2, h3, h4').first().textContent()) ?? '');
        const listo = tooltip(page).getByRole('button', { name: 'Listo' });
        if (await listo.count()) {
            await listo.click();
            break;
        }
        await tooltip(page).getByRole('button', { name: /^Siguiente/ }).click();
    }
    await expect(tooltip(page)).toHaveCount(0);
    return titulos;
}

test('el tour no arranca solo, solo con "?"', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Buscar resoluciones')).toBeVisible();
    await expect(tooltip(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Ver tutorial' }).click();
    expect(await recorrer(page)).toContain('Busque resoluciones');
});

test('Esc cierra el tour y el "?" lo reinicia desde el primer paso', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ver tutorial' }).click();
    await tooltip(page).getByRole('button', { name: /^Siguiente/ }).click();
    await page.keyboard.press('Escape');
    await expect(tooltip(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Ver tutorial' }).click();
    await expect(tooltip(page)).toContainText('Busque resoluciones');
});

test('tour del lector, sin cerrar el lector con Esc', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Buscar resoluciones').fill('consentimiento');
    await page.getByRole('button', { name: /^Abrir resolución:/ }).first().click();
    const dialogo = page.getByRole('dialog', { name: /./ }).first();
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Ver tutorial' }).click();
    await expect(tooltip(page)).toContainText('La resolución');
    await page.keyboard.press('Escape');
    await expect(tooltip(page)).toHaveCount(0);
    await expect(page.locator('#reader-title')).toBeVisible();
    await dialogo.getByRole('button', { name: 'Ver tutorial' }).click();
    expect(await recorrer(page)).toContain('Volver al buscador');
});

test('tour del grafo', async ({ page }) => {
    await page.goto('/grafo/');
    await expect(page.getByLabel('Buscar resoluciones en el grafo')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Ver tutorial' }).click();
    expect(await recorrer(page)).toContain('Busque en el grafo');
});

test('tour de los formularios', async ({ page }) => {
    await page.goto('/formularios/');
    await page.getByRole('button', { name: 'Ver tutorial' }).click();
    expect(await recorrer(page)).toContain('Elija su formulario');

    await page.goto('/formularios/personas-fisicas/');
    await page.getByRole('button', { name: 'Ver tutorial' }).click();
    expect(await recorrer(page)).toEqual(expect.arrayContaining(['Secciones del formulario', 'Avanzar y exportar']));
});

for (const ruta of ['/estadisticas/', '/disclaimer/']) {
    test(`"?" responde en ${ruta}`, async ({ page }) => {
        await page.goto(ruta);
        await page.getByRole('button', { name: 'Ver tutorial' }).click();
        await recorrer(page);
    });
}
