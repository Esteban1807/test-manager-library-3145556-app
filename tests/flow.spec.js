import { test, expect } from '@playwright/test';

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

// Unique data per run, so the test works on an empty or an already seeded database
const stamp = Date.now().toString();
const book = { title: `Libro E2E ${stamp}`, isbn: stamp.padStart(13, '9').slice(-13) };
const member = { name: `Socio E2E ${stamp}`, document: `E2E${stamp}` };
const librarian = { username: `biblio${stamp}`, password: `Clave-${stamp}` };

async function login(page, user, pass) {
  await page.goto('/');
  await page.getByLabel('Usuario').fill(user);
  await page.getByLabel('Contraseña').fill(pass);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible();
}

test.beforeAll(() => {
  if (!username || !password) throw new Error('Define E2E_USERNAME y E2E_PASSWORD con un usuario administrador.');
});

test('el administrador recorre catálogo, socios, préstamo, devolución, vencidos y reporte', async ({ page }) => {
  await login(page, username, password);

  // Catálogo: crear un libro (HU-03)
  await page.getByRole('button', { name: 'Nuevo libro' }).click();
  const bookForm = page.locator('form.card');
  await bookForm.getByLabel('Título', { exact: true }).fill(book.title);
  await bookForm.getByLabel('Autor').fill('Autora de prueba');
  await bookForm.getByLabel('ISBN (13 dígitos)').fill(book.isbn);
  await bookForm.getByLabel('Categoría').selectOption({ label: 'Novela' });
  await bookForm.getByLabel('Total de ejemplares').fill('2');
  await bookForm.getByRole('button', { name: 'Guardar libro' }).click();
  await expect(page.getByRole('status')).toContainText(book.title);

  // Catálogo: buscar (HU-04)
  await page.getByLabel('Buscar por título o autor').fill(book.title);
  await expect(page.getByRole('cell', { name: book.title })).toBeVisible();
  await expect(page.getByRole('cell', { name: '2 de 2' })).toBeVisible();

  // Socios: registrar (HU-05)
  await page.getByRole('link', { name: 'Socios' }).click();
  await page.getByLabel('Nombre completo').fill(member.name);
  await page.getByLabel('Documento', { exact: true }).fill(member.document);
  await page.getByRole('button', { name: 'Registrar socio' }).click();
  await expect(page.getByRole('status')).toContainText(member.name);

  // Prestar (HU-06)
  await page.getByRole('link', { name: 'Prestar' }).click();
  await page.getByLabel('Buscar socio por nombre o documento').fill(member.document);
  await page.getByRole('button', { name: `Elegir a ${member.name}` }).click();
  await page.getByLabel('Buscar libro por título o autor').fill(book.title);
  await page.getByRole('button', { name: `Agregar «${book.title}»` }).click();
  await page.getByRole('button', { name: 'Registrar préstamo' }).click();
  await expect(page.getByRole('status')).toContainText('Préstamo registrado');

  // Préstamos: el préstamo está abierto y se devuelve (HU-07, HU-08)
  await page.getByRole('link', { name: 'Préstamos' }).click();
  const loan = page.locator('article.loan', { hasText: book.title });
  await expect(loan.getByText('Abierto')).toBeVisible();
  await loan.getByRole('button', { name: 'Registrar devolución' }).click();
  await expect(page.getByRole('status')).toContainText(book.title);
  await expect(loan.getByText('Cerrado')).toBeVisible();

  // Vencidos (HU-09)
  await page.getByRole('link', { name: 'Vencidos' }).click();
  await expect(page.getByRole('heading', { name: 'Libros vencidos' })).toBeVisible();

  // Reporte (HU-10): el libro prestado aparece
  await page.getByRole('link', { name: 'Reporte' }).click();
  await expect(page.getByRole('cell', { name: book.title })).toBeVisible();
});

test('un bibliotecario creado por el administrador no ve el reporte', async ({ page }) => {
  await login(page, username, password);

  // Alta de bibliotecario (HU-02)
  await page.getByRole('link', { name: 'Bibliotecarios' }).click();
  await page.getByLabel('Nombre de usuario').fill(librarian.username);
  await page.getByLabel('Contraseña').fill(librarian.password);
  await page.getByRole('button', { name: 'Crear bibliotecario' }).click();
  await expect(page.getByRole('status')).toContainText(librarian.username);

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await login(page, librarian.username, librarian.password);

  await expect(page.getByRole('link', { name: 'Vencidos' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reporte' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Bibliotecarios' })).toHaveCount(0);
});

test('credenciales incorrectas muestran el mensaje de la API', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Usuario').fill('nadie');
  await page.getByLabel('Contraseña').fill('incorrecta');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('alert')).toContainText('Usuario o contraseña incorrectos');
});
