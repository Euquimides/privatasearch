import { test, expect } from '@playwright/test';

const RUTA = '/formularios/personas-fisicas/';

test('"Siguiente" con errores lleva el foco al primer campo inválido', async ({ page }) => {
    await page.goto(RUTA);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.getByRole('status').filter({ hasText: /campos con error/ })).toBeVisible();
    await expect(page.getByLabel('Apellidos')).toBeFocused();
    await expect(page.getByLabel('Apellidos')).toBeInViewport();
});

test('"Borrar todo" confirma y respeta la cancelación', async ({ page }) => {
    await page.goto(RUTA);
    await page.getByLabel('Apellidos').fill('prueba');

    page.once('dialog', (d) => { expect(d.message()).toMatch(/secciones/); d.dismiss(); });
    await page.getByRole('button', { name: 'Borrar todo' }).click();
    await expect(page.getByLabel('Apellidos')).toHaveValue('prueba');

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Borrar todo' }).click();
    await expect(page.getByLabel('Apellidos')).toHaveValue('');
});
