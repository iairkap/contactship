# Contactship-Mini Backend

API REST para gestión y sincronización automatizada de leads con Inteligencia Artificial.

## 🚀 Stack Tecnológico

- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma 5.22.0
- **Base de Datos:** PostgreSQL (Supabase)
- **Cache:** Redis 8.4.0
- **Colas:** BullMQ
- **Scheduler:** @nestjs/schedule
- **IA:** Google Gemini 1.5 Flash (API gratuita)

## 📋 Requisitos Previos

- Node.js v20.8.0 o superior
- npm v10.8.1 o superior
- Redis instalado y corriendo
- Cuenta de Supabase (gratuita)
- API Key de Google Gemini (gratuita)

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone <url-repositorio>
cd contactship
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Database - Supabase
DATABASE_URL="postgresql://postgres.kukqzqbydfbljeeyxzag:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.kukqzqbydfbljeeyxzag:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# API Security
API_KEY="tu-api-key-aqui"

# Application
PORT=3000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Google Gemini AI
GOOGLE_AI_API_KEY="tu-google-ai-api-key"
```

### 4. Instalar y ejecutar Redis

**macOS (con Homebrew):**
```bash
brew install redis
brew services start redis
```

**Verificar que Redis está corriendo:**
```bash
redis-cli ping
# Debe responder: PONG
```

### 5. Ejecutar migraciones de base de datos

```bash
npx prisma migrate dev
```

### 6. Generar cliente de Prisma

```bash
npx prisma generate
```

## 🏃 Ejecución

### Modo desarrollo (con hot-reload)

```bash
npm run start:dev
```

### Modo producción

```bash
npm run build
npm run start:prod
```

La aplicación estará disponible en: `http://localhost:3000`

## 📡 API Endpoints

Todos los endpoints requieren el header `x-api-key` con tu API key configurada en `.env`.

### 1. Crear Lead Manual

**Endpoint:** `POST /create-lead`

**Headers:**
```
Content-Type: application/json
x-api-key: tu-api-key-aqui
```

**Body:**
```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",  // Opcional
  "city": "New York",      // Opcional
  "country": "USA"         // Opcional
}
```

**Respuesta exitosa (201):**
```json
{
  "id": "uuid-generado",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "city": "New York",
  "country": "USA",
  "summary": null,
  "nextAction": null,
  "createdAt": "2026-01-14T20:00:00.000Z",
  "updatedAt": "2026-01-14T20:00:00.000Z"
}
```

**Respuesta de error - Email duplicado (409):**
```json
{
  "statusCode": 409,
  "message": "Lead with this email already exists"
}
```

### 2. Listar Todos los Leads

**Endpoint:** `GET /leads`

**Headers:**
```
x-api-key: tu-api-key-aqui
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": "uuid-1",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    ...
  },
  {
    "id": "uuid-2",
    "email": "maria@example.com",
    "firstName": "Maria",
    "lastName": "Garcia",
    ...
  }
]
```

### 3. Obtener Lead por ID (con Caché)

**Endpoint:** `GET /leads/:id`

**Headers:**
```
x-api-key: tu-api-key-aqui
```

**Respuesta exitosa (200):**
```json
{
  "id": "uuid-del-lead",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "city": "New York",
  "country": "USA",
  "summary": "Lead potencial interesado en servicios tech",
  "nextAction": "Contactar por email para agendar llamada",
  "createdAt": "2026-01-14T20:00:00.000Z",
  "updatedAt": "2026-01-14T20:05:00.000Z"
}
```

**Respuesta de error - No encontrado (404):**
```json
{
  "statusCode": 404,
  "message": "Lead with ID xxx not found"
}
```

**Nota:** Este endpoint implementa **Cache-Aside**:
- Primera consulta: busca en DB y guarda en Redis (TTL: 5 min)
- Siguientes consultas: retorna desde Redis (más rápido)
- El caché se invalida al hacer summarize

### 4. Generar Resumen con IA

**Endpoint:** `POST /leads/:id/summarize`

**Headers:**
```
x-api-key: tu-api-key-aqui
```

**Respuesta exitosa (200):**
```json
{
  "id": "uuid-del-lead",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "summary": "Lead potencial de Nueva York con experiencia en tecnología",
  "nextAction": "Contactar por email para presentar propuesta de servicios",
  ...
}
```

**Nota:** 
- Genera `summary` y `nextAction` usando Google Gemini
- Actualiza el lead en la base de datos
- Invalida el caché automáticamente

## 🧪 Testing Manual con cURL

### Ejemplo completo de flujo:

```bash
# 1. Crear un lead
curl -X POST 'http://localhost:3000/create-lead' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: tu-api-key-aqui' \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "city": "Madrid",
    "country": "Spain"
  }'

# Respuesta: guarda el "id" del lead creado

# 2. Listar todos los leads
curl -X GET 'http://localhost:3000/leads' \
  -H 'x-api-key: tu-api-key-aqui'

# 3. Obtener detalle de un lead (reemplaza :id)
curl -X GET 'http://localhost:3000/leads/<ID-DEL-LEAD>' \
  -H 'x-api-key: tu-api-key-aqui'

# 4. Generar resumen con IA (reemplaza :id)
curl -X POST 'http://localhost:3000/leads/<ID-DEL-LEAD>/summarize' \
  -H 'x-api-key: tu-api-key-aqui'

# 5. Verificar que el lead ahora tiene summary y nextAction
curl -X GET 'http://localhost:3000/leads/<ID-DEL-LEAD>' \
  -H 'x-api-key: tu-api-key-aqui'
```

## ⏰ Sincronización Automática (CRON)

El sistema importa automáticamente 10 leads desde `randomuser.me` cada hora.

**Configuración:**
- CRON: `@Cron(CronExpression.EVERY_HOUR)`
- API: https://randomuser.me/api/?results=10
- Deduplicación: Por email único
- Cola: BullMQ con Redis

**Logs del scheduler:**
```
[LeadsSyncScheduler] Starting scheduled leads import job
[LeadsSyncScheduler] Leads import job queued successfully
[LeadsImportProcessor] Processing job xxx: importing leads from randomuser.me
[LeadsImportProcessor] Import completed: 8 imported, 2 duplicates skipped
```

## 🗄️ Base de Datos

### Modelo Lead (Prisma Schema)

```prisma
model Lead {
  id         String   @id @default(uuid())
  email      String   @unique
  firstName  String
  lastName   String
  phone      String?
  city       String?
  country    String?
  summary    String?  @db.Text
  nextAction String?  @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt()

  @@map("leads")
}
```

### Comandos útiles de Prisma

```bash
# Ver base de datos en Prisma Studio
npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name nombre-migracion

# Resetear base de datos (¡CUIDADO! Borra todos los datos)
npx prisma migrate reset
```

## 🔐 Seguridad

### API Key Guard

Todos los endpoints están protegidos con un Guard de API Key:

```typescript
// Header requerido en todas las peticiones
x-api-key: tu-api-key-desde-env
```

**Sin API Key:**
```json
{
  "statusCode": 401,
  "message": "Invalid or missing API Key"
}
```

## 🎯 Características Implementadas

- ✅ CRUD de leads con validación (DTOs + class-validator)
- ✅ Deduplicación por email único
- ✅ Autenticación con API Key
- ✅ Sincronización automática con CRON (cada hora)
- ✅ Cola de trabajos asíncrona con BullMQ
- ✅ Caché con Redis (estrategia Cache-Aside)
- ✅ Integración con Google Gemini IA
- ✅ Generación de resúmenes y acciones con IA
- ✅ Persistencia en PostgreSQL (Supabase)

## 🐛 Troubleshooting

### Error: "Cannot connect to Redis"

```bash
# Verificar que Redis esté corriendo
redis-cli ping

# Si no responde, iniciar Redis
brew services start redis
```

### Error: "Invalid or missing API Key"

- Verifica que el archivo `.env` tenga la variable `API_KEY` configurada
- Asegúrate de incluir el header `x-api-key` en tus peticiones

### Error: "Prisma Client is not generated"

```bash
npx prisma generate
```

### Error 500 en endpoint de IA

- Verifica que `GOOGLE_AI_API_KEY` esté configurada en `.env`
- Confirma que la API key de Google Gemini sea válida
- Revisa los logs del servidor para más detalles

## 📚 Documentación Adicional

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Google Gemini API](https://ai.google.dev/docs)

## 📝 Licencia

MIT
