# E-commerce API

API REST para una tienda en línea, construida con Node.js, Express y Prisma (SQLite).

## Stack

- Node.js + Express
- Prisma ORM + SQLite
- JWT (access + refresh tokens)
- bcryptjs para hash de contraseñas
- express-validator para validación de datos
- helmet + rate-limit para seguridad básica

## Estructura del proyecto

```
ecommerce-api/
├── prisma/
│   ├── schema.prisma      # Modelos de datos
│   └── seed.js            # Datos de prueba
├── src/
│   ├── config/db.js       # Cliente Prisma
│   ├── controllers/       # Lógica de cada recurso
│   ├── middleware/        # Auth, roles, errores, validación
│   ├── routes/             # Definición de endpoints
│   ├── services/           # Lógica de negocio compleja (órdenes, stock)
│   ├── utils/               # JWT, ApiError
│   ├── app.js              # Configuración de Express
│   └── server.js           # Punto de entrada
├── .env.example
└── package.json
```

## Instalación

```bash
cd ecommerce-api
npm install
cp .env.example .env       # ajusta los secretos de JWT si quieres
npm run prisma:migrate     # crea la base de datos SQLite y las tablas
npm run seed                # opcional: crea un admin y productos de prueba
npm run dev                  # levanta el servidor con nodemon
```

El servidor corre por defecto en `http://localhost:4000`.

Usuario admin de prueba tras el seed: `admin@shop.com` / `admin123`

## Endpoints principales

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/auth/register | Crear cuenta |
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/refresh | Renovar access token |

### Productos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | /api/products | No | Listar (filtros: category, minPrice, maxPrice, search, page, limit) |
| GET | /api/products/:id | No | Detalle |
| POST | /api/products | Admin | Crear |
| PUT | /api/products/:id | Admin | Editar |
| DELETE | /api/products/:id | Admin | Desactivar (soft delete) |

### Categorías
| Método | Ruta | Auth |
|---|---|---|
| GET | /api/categories | No |
| POST | /api/categories | Admin |
| DELETE | /api/categories/:id | Admin |

### Carrito (requiere login)
| Método | Ruta |
|---|---|
| GET | /api/cart |
| POST | /api/cart/items |
| PUT | /api/cart/items/:id |
| DELETE | /api/cart/items/:id |

### Órdenes (requiere login)
| Método | Ruta | Auth |
|---|---|---|
| POST | /api/orders | Usuario | Crea orden desde el carrito |
| GET | /api/orders | Usuario | Historial propio |
| GET | /api/orders/:id | Usuario/Admin | Detalle |
| PUT | /api/orders/:id/status | Admin | Cambia estado |
| POST | /api/orders/:id/cancel | Usuario | Cancela y repone stock |

### Pagos
| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/payments/create-intent | Simula intención de pago |
| POST | /api/payments/webhook | Simula confirmación del proveedor |

### Reseñas
| Método | Ruta |
|---|---|
| GET | /api/products/:productId/reviews |
| POST | /api/products/:productId/reviews (requiere haber comprado el producto) |

## Ejemplo de flujo completo

```bash
# 1. Registro
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@test.com","password":"123456"}'

# 2. Agregar producto al carrito (usa el accessToken de la respuesta anterior)
curl -X POST http://localhost:4000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -d '{"productId":1,"quantity":2}'

# 3. Crear orden desde el carrito
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

## Decisiones de diseño importantes

- **Stock con transacciones atómicas**: al crear una orden, el descuento de stock ocurre dentro de una transacción de Prisma (`orderService.js`), evitando condiciones de carrera si dos usuarios compran el último producto simultáneamente.
- **Precio inmutable en el pedido**: `OrderItem.unitPrice` guarda el precio al momento de la compra, independiente de cambios futuros en `Product.price`.
- **Máquina de estados de orden**: las transiciones válidas están explícitas en `VALID_TRANSITIONS` (orderService.js); no se permite saltar de `DELIVERED` a `PENDING`, por ejemplo.
- **Soft delete de productos**: eliminar un producto lo marca `active: false` en vez de borrarlo, preservando el historial de órdenes pasadas.
- **Pagos simulados**: `paymentController.js` está listo para conectarse a Stripe/PayPal real; solo hay que reemplazar la simulación por las llamadas al SDK correspondiente y validar la firma del webhook.

## Próximos pasos sugeridos

- Agregar tests con Jest + Supertest
- Documentar con Swagger/OpenAPI
- Dockerizar (Dockerfile + docker-compose con Postgres para producción)
- Integrar Stripe real
- Agregar wishlist y cupones de descuento

---

## Autor

**Kevin Smith Bermeo Rico**
📧 Yitrey0206@gmail.com
🔗 [github.com/KevinBermeo0318](https://github.com/KevinBermeo0318)