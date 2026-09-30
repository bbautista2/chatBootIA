# Instagram Multi-Account Chatbot with Admin Panel

Sistema completo de chatbot para Instagram con gestión multi-cuenta, panel de administración, flujos de conversación visuales e integración con IA.

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + TypeScript + NestJS |
| Base de datos | PostgreSQL + Prisma ORM |
| Cache/Colas | Redis + BullMQ |
| Frontend | Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui |
| Autenticación | JWT (backend) + NextAuth (frontend) |
| Integración | Meta Graph API (Instagram Messaging API) |
| WebSocket | Socket.io |
| Containerización | Docker + Docker Compose |

## Características

- Multi-cuenta: Gestiona múltiples cuentas de Instagram desde un solo panel
- Flujos de conversación: Editor visual drag-and-drop con ReactFlow
- Inbox en tiempo real: Chat en vivo con notificaciones WebSocket
- Integración IA: OpenAI configurable por cuenta
- Seguridad: JWT, roles, multi-tenancy, encriptación de tokens
- Horario comercial: Configuración de horarios por cuenta

## Requisitos Previos

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker y Docker Compose (opcional)
- Cuenta de desarrollador en [Meta for Developers](https://developers.facebook.com)

## Instalación Rápida (Docker)

```bash
# Clonar el repositorio
git clone <repo-url>
cd instagram-chatbot

# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Editar .env con tus credenciales de Meta
# Editar NEXTAUTH_SECRET con un valor seguro

# Levantar todos los servicios
docker-compose up -d

# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Sembrar datos de prueba
docker-compose exec backend npx prisma db seed

# Acceder al panel
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api
```

## Instalación Manual (Desarrollo)

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Sembrar datos de prueba
npx prisma db seed

# Iniciar en modo desarrollo
npm run start:dev
```

El backend estará disponible en `http://localhost:3001`

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local

# Iniciar en modo desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Credenciales de Prueba

| Campo | Valor |
|-------|-------|
| Email | admin@chatbot.com |
| Password | admin123 |

## Configuración de Meta for Developers

### 1. Crear una Aplicación

1. Ve a [Meta for Developers](https://developers.facebook.com)
2. Crea una nueva aplicación de tipo "Business"
3. Agrega el producto "Instagram Graph API"

### 2. Configurar Instagram Graph API

1. En tu app, ve a **Instagram** > **Graph API**
2. Configura los permisos necesarios:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `pages_manage_metadata`

### 3. Configurar Webhook

1. Ve a **Webhooks** y suscríbete al evento `messages`
2. URL del webhook: `https://tu-dominio.com/api/webhooks/instagram`
3. Token de verificación: usa el valor de `META_VERIFY_TOKEN` en tu `.env`

### 4. Generar Tokens

1. Usa el **Graph API Explorer** para generar un User Access Token
2. Intercambia por un Long-Lived Token
3. Obtén el Page Access Token con los permisos de Instagram
4. El `ig_user_id` se obtiene del endpoint `/me/accounts?fields=instagram_business_account`

### 5. Variables de Entorno Requeridas

```
META_APP_ID= tu_app_id
META_APP_SECRET= tu_app_secret
META_VERIFY_TOKEN= tu_token_de_verificacion
```

## Estructura del Proyecto

```
├── backend/                    # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de base de datos
│   │   └── seed.ts             # Datos de prueba
│   └── src/
│       ├── auth/               # Autenticación JWT
│       ├── accounts/           # CRUD de cuentas Instagram
│       ├── webhooks/           # Endpoints de Meta
│       ├── flows/              # CRUD de flujos
│       ├── flow-engine/        # Motor de evaluación de flujos
│       ├── messages/           # Historial y envío de mensajes
│       ├── contacts/           # Gestión de contactos
│       ├── ai-integration/     # Integración OpenAI
│       ├── dashboard/          # Métricas
│       ├── queue/              # BullMQ workers
│       └── events/             # WebSocket gateway
├── frontend/                   # Next.js Admin Panel
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # Páginas de autenticación
│       │   └── (dashboard)/    # Páginas del panel
│       ├── components/
│       │   ├── ui/             # Componentes shadcn/ui
│       │   ├── layout/         # Sidebar, Header
│       │   └── flow-builder/   # Editor visual de flujos
│       └── lib/                # Utilidades, API, auth
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar admin (solo superadmin)

### Cuentas
- `GET /api/accounts` - Listar cuentas
- `POST /api/accounts` - Crear cuenta
- `GET /api/accounts/:id` - Obtener cuenta
- `PATCH /api/accounts/:id` - Actualizar cuenta
- `DELETE /api/accounts/:id` - Eliminar cuenta
- `GET /api/accounts/:id/config` - Obtener config del bot
- `PATCH /api/accounts/:id/config` - Actualizar config del bot

### Flujos
- `GET /api/accounts/:accountId/flows` - Listar flujos
- `POST /api/accounts/:accountId/flows` - Crear flujo
- `PATCH /api/flows/:id` - Actualizar flujo
- `DELETE /api/flows/:id` - Eliminar flujo
- `PATCH /api/flows/:id/toggle` - Activar/desactivar

### Mensajes
- `GET /api/conversations/:id/messages` - Listar mensajes
- `POST /api/conversations/:id/messages` - Enviar mensaje

### Contactos
- `GET /api/accounts/:accountId/contacts` - Listar contactos
- `PATCH /api/accounts/:accountId/contacts/:id` - Actualizar contactos

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/messages-by-day` - Mensajes por día
- `GET /api/dashboard/messages-by-account` - Mensajes por cuenta
- `GET /api/dashboard/conversations-by-status` - Conversaciones por estado

### Webhooks
- `GET /api/webhooks/instagram` - Verificación de Meta
- `POST /api/webhooks/instagram` - Recepción de mensajes

## Scripts Disponibles

```bash
# Root
npm run dev              # Iniciar backend + frontend
npm run build            # Construir ambos
npm run docker:up        # Levantar Docker
npm run docker:down      # Detener Docker

# Backend
npm run start:dev        # Desarrollo con hot-reload
npm run build            # Construir
npm run start:prod       # Producción
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:seed      # Sembrar datos
npm run lint             # Linting

# Frontend
npm run dev              # Desarrollo
npm run build            # Construir
npm run start            # Producción
npm run lint             # Linting
```

## Licencia

MIT
