# Cómo usar el frontend

Aplicación en React 19 con Vite y React Router. Consume la API de Manager Library según `api-contract.md`.

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Ese puerto es el origen que la API permite por defecto (`CORS_ALLOWED_ORIGINS`).

La dirección de la API se lee de `VITE_API_URL`. Copia `.env.example` a `.env.local` si no usas `http://localhost:8000/api/v1`.

## Pantallas

| Pantalla | Historia | Quién la ve |
|---|---|---|
| Iniciar sesión | HU-01 | Todos |
| Catálogo: buscar, crear, editar, dar de baja, portada | HU-03, HU-04 | Todos leen; el administrador escribe |
| Socios: buscar y registrar | HU-05 | Administrador y bibliotecario |
| Prestar | HU-06 | Administrador y bibliotecario |
| Préstamos: filtrar y registrar devoluciones | HU-07, HU-08 | Administrador y bibliotecario |
| Vencidos | HU-09 | Administrador y bibliotecario |
| Reporte de más prestados | HU-10 | Administrador |
| Bibliotecarios | HU-02 | Administrador |

Las reglas de negocio las decide la API. La aplicación muestra el mensaje que la API devuelve, sin reinterpretarlo.

## Pruebas de punta a punta (T-22)

Necesitan la API en marcha y una cuenta de administrador:

```bash
E2E_USERNAME=admin E2E_PASSWORD=tu-clave npm run test:e2e
```

En PowerShell:

```powershell
$env:E2E_USERNAME='admin'; $env:E2E_PASSWORD='tu-clave'; npm run test:e2e
```

Recorren: login, crear y buscar un libro, registrar un socio, prestar, devolver, vencidos, reporte, alta de un bibliotecario y sus permisos. Usan el navegador Edge ya instalado; para usar Chrome, define `PW_CHANNEL=chrome`.

Cada ejecución crea datos nuevos con nombres únicos, así que funciona sobre una base vacía o ya sembrada.
