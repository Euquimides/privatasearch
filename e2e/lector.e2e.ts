import { test, expect } from '@playwright/test';

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop'));
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Buscar resoluciones').fill('consentimiento');
    await page.getByRole('button', { name: /^Abrir resolución:/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
});

test('copiar cita muestra confirmación', async ({ page }) => {
    const dialogo = page.getByRole('dialog');
    await dialogo.getByRole('button', { name: /^Citar$/ }).click();
    await expect(dialogo.getByRole('button', { name: 'Copiado' }).first()).toBeVisible();
});

test('copiar enlace muestra confirmación', async ({ page }) => {
    const dialogo = page.getByRole('dialog');
    const boton = dialogo.getByRole('button', { name: /^Enlace$/ });
    test.skip((await boton.count()) === 0, 'la resolución no tiene número asignado');
    await boton.click();
    await expect(dialogo.getByRole('button', { name: 'Copiado' })).toBeVisible();
});

test('el enlace "Red" apunta al grafo de citas de esta resolución', async ({ page }) => {
    const dialogo = page.getByRole('dialog');
    const numero = await dialogo.locator('span.font-mono').first().textContent();
    const enlace = dialogo.getByRole('link', { name: /^Red$/ });
    test.skip((await enlace.count()) === 0, 'la resolución no tiene número asignado');
    await expect(enlace).toHaveAttribute('href', `/grafo/#res=${numero}`);
});

test('Escape cierra el panel de lectura', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
});

test('abrir una resolución relacionada la muestra en el panel', async ({ page }) => {
    const dialogo = page.getByRole('dialog');
    const relacionada = dialogo.getByRole('button', { name: /^Abrir resolución:/ }).first();
    test.skip((await relacionada.count()) === 0, 'no hay resoluciones relacionadas para esta consulta');
    const tituloAnterior = await dialogo.locator('#reader-title').textContent();
    await relacionada.click();
    await expect(dialogo.locator('#reader-title')).not.toHaveText(tituloAnterior ?? '');
});

test('enlace directo #abrir=<resolución> abre el panel de lectura', async ({ page }) => {
    const dialogo = page.getByRole('dialog');
    // la barra superior cae al expediente si no hay resolución; se lee el dato de la ficha
    const numero = (await dialogo.locator('div:has(> dt:text-is("N.° de resolución")) dd').textContent())?.trim();
    test.skip(!numero || numero === '—', 'la resolución no tiene número asignado');

    await dialogo.getByRole('button', { name: 'Cerrar' }).click();
    await expect(dialogo).toBeHidden();

    // goto a la misma ruta con solo el hash distinto es una navegación same-document
    // (no recarga la app); se pasa por otra página primero para forzar una carga real.
    await page.goto('/disclaimer/');
    await page.goto(`/#abrir=${numero}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('span.font-mono').first()).toHaveText(numero!);
});
