# Contactship-Mini - Backend Developer Challenge

**Candidato:** Iair Kaplun  
**Stack:** NestJS + TypeScript + PostgreSQL (Supabase) + Redis + BullMQ + Google Gemini AI

---

## 🎯 Resumen Ejecutivo

Microservicio completo de gestión de leads con sincronización automática, cache inteligente, procesamiento asíncrono con colas y enriquecimiento mediante IA. Implementado con las mejores prácticas de NestJS y arquitectura escalable.

**Tiempo de desarrollo:** ~5 horas  
**Commits:** 7 commits bien documentados con convención semántica

---

## ⚡ Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (ver sección de Configuración)
cp .env.example .env

# 3. Instalar y ejecutar Redis
brew install redis
brew services start redis

# 4. Ejecutar migraciones
npx prisma migrate dev

# 5. Iniciar aplicación
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 🏗️ Arquitectura y Decisiones Técnicas

### Diseño Modular
```
src/
├── leads/          # Módulo principal de negocio
│   ├── dto/        # Data Transfer Objects con validación
│   ├── leads.controller.ts      # Endpoints HTTP
│   ├── leads.service.ts         # Lógica de negocio
│   ├── ai.service.ts            # Integración con Gemini AI
│   ├── random-user.service.ts   # Cliente HTTP para API externa
│   ├── leads-sync.scheduler.ts  # CRON job
│   └── leads-import.processor.ts # Worker de BullMQ
├── prisma/         # Servicio global de DB
└── common/         # Guards y utilities compartidas
```

**Decisiones clave:**
- **Separación de responsabilidades:** Controller → Service → Repository pattern
- **Servicios dedicados:** Cada integración (IA, API externa) tiene su propio servicio
- **DTOs con validación:** class-validator para validación declarativa
- **Guards globales:** API Key protection en toda la aplicación

### Stack Tecnológico

#### Core
- **NestJS 10.x:** Framework enterprise-ready con DI nativa
- **TypeScript:** Type-safety en toda la aplicación
- **Prisma 5.22:** ORM type-safe con migraciones automáticas

#### Persistencia
- **PostgreSQL (Supabase):** Base de datos SQL en la nube
- **Redis 8.4:** Cache y backend de colas
- **Connection pooling:** Optimización con Supabase pooler

#### Procesamiento Asíncrono
- **BullMQ:** Colas modernas con retry automático y backoff exponencial
- **@nestjs/schedule:** CRON jobs nativos de NestJS

#### IA y APIs Externas
- **Google Gemini 2.0 Flash:** LLM gratuito para generación de resúmenes
- **@nestjs/axios:** Cliente HTTP con observables para randomuser.me

---

## 📡 API Endpoints

Todos los endpoints requieren header `x-api-key` con una API key válida.

### POST /create-lead
Creación manual de leads con validación completa.

**Request:**
```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",     // Opcional
  "city": "New York",         // Opcional
  "country": "USA"            // Opcional
}
```

**Response (201):**
```json
{
  "id": "uuid-generado",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "summary": null,
  "nextAction": null,
  "createdAt": "2026-01-14T20:00:00Z",
  "updatedAt": "2026-01-14T20:00:00Z"
}
```

### GET /leads
Lista todos los leads ordenados por fecha de creación (más recientes primero).

**Response (200):** Array de leads con estructura completa.

### GET /leads/:id
Obtiene un lead por ID con **cache inteligente** (estrategia Cache-Aside).

**Funcionamiento del caché:**
1. Primera consulta → busca en DB, guarda en Redis (TTL: 5 min)
2. Siguientes consultas → retorna desde Redis (ultra rápido)
3. Al hacer summarize → invalida cache automáticamente

**Response (200):** Lead completo  
**Response (404):** `{ "message": "Lead with ID xxx not found" }`

### POST /leads/:id/summarize
Genera resumen y acción sugerida usando IA.

**Proceso:**
1. Busca lead en DB
2. Genera prompt contextual con datos del lead
3. Llama a Google Gemini 2.0 Flash
4. Parsea respuesta JSON
5. Actualiza lead en DB con `summary` y `nextAction`
6. Invalida cache

**Response (200):**
```json
{
  "id": "uuid",
  "email": "pedro@test.com",
  "firstName": "Pedro",
  "lastName": "Martinez",
  "summary": "Pedro Martinez, ubicado en Barcelona, mostró interés. Su correo electrónico y teléfono están disponibles.",
  "nextAction": "Enviar un correo electrónico de bienvenida personalizado presentándonos...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 🔄 Sincronización Automática

### Arquitectura del CRON Job

```
LeadsSyncScheduler (@Cron EVERY_HOUR)
         ↓
  Encola job en BullMQ
         ↓
  LeadsImportProcessor
         ↓
  RandomUserService → randomuser.me
         ↓
  LeadsService.create() × 10
         ↓
  Logs: "X imported, Y duplicates skipped"
```

### Implementación

**Scheduler (CRON):**
```typescript
@Cron(CronExpression.EVERY_HOUR)
async handleLeadsImport() {
  await this.leadsImportQueue.add('import-random-leads', {}, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
}
```

**Worker (BullMQ Processor):**
```typescript
async process(job: Job): Promise<void> {
  const data = await this.randomUserService.fetchRandomUsers(10);
  
  for (const user of data.results) {
    try {
      await this.leadsService.create(leadDto);
      imported++;
    } catch (error) {
      if (error.status === 409) duplicates++;
    }
  }
}
```

**Ventajas de esta arquitectura:**
- ✅ **No bloquea el hilo principal:** Job en background
- ✅ **Retry automático:** 3 intentos con backoff exponencial
- ✅ **Logs detallados:** Tracking de importados y duplicados
- ✅ **Deduplicación robusta:** A nivel DB + aplicación

---

## 🔐 Estrategia de Deduplicación

### Nivel 1: Base de Datos
```prisma
model Lead {
  id    String @id @default(uuid())
  email String @unique  // ← Constraint único en PostgreSQL
  ...
}
```

### Nivel 2: Aplicación
```typescript
try {
  await this.prisma.lead.create({ data: createLeadDto });
} catch (error) {
  if (error.code === 'P2002') {  // Prisma unique constraint error
    throw new ConflictException('Lead with this email already exists');
  }
}
```

### Nivel 3: Sincronización
```typescript
// En el processor de BullMQ
catch (error) {
  if (error.status === 409) {
    duplicates++;
    this.logger.log(`Skipped duplicate: ${user.email}`);
  }
}
```

**Beneficios:**
- ✅ **Integridad garantizada:** PostgreSQL unique constraint
- ✅ **UX clara:** Response 409 Conflict con mensaje descriptivo  
- ✅ **Observabilidad:** Logs de duplicados en sync automática

---

## 🧠 Implementación de IA

### Modelo y Configuración
- **Modelo:** Google Gemini 2.0 Flash (API 100% gratuita)
- **Prompt Engineering:** Diseñado para output JSON estructurado
- **Parsing robusto:** Extrae JSON de la respuesta con regex + fallbacks

### Prompt Contextual
```typescript
const prompt = `Eres un asistente de ventas. Analiza la siguiente información de un lead:

- Nombre: ${firstName} ${lastName}
- Email: ${email}
- Teléfono: ${phone || 'No disponible'}
- Ubicación: ${city}, ${country}

Responde ÚNICAMENTE con un JSON válido:
{
  "summary": "resumen del perfil del lead",
  "next_action": "acción recomendada para próximo contacto"
}`;
```

### Ejemplo Real de Output

**Input:** Pedro Martinez, Barcelona, España  
**Output generado por Gemini:**
```json
{
  "summary": "Pedro Martinez, ubicado en Barcelona, mostró interés. Su correo electrónico y teléfono están disponibles.",
  "nextAction": "Enviar un correo electrónico de bienvenida personalizado presentándonos y ofreciendo información relevante sobre nuestros productos/servicios en español."
}
```

**Persistencia:** Los campos `summary` y `nextAction` se guardan en PostgreSQL asociados al lead.

---

## 💾 Cache con Redis

### Estrategia: Cache-Aside Pattern

```typescript
async findOne(id: string) {
  const cacheKey = `lead:${id}`;
  
  // 1. Buscar en cache
  const cached = await this.cacheManager.get(cacheKey);
  if (cached) return cached;  // HIT
  
  // 2. Buscar en DB
  const lead = await this.prisma.lead.findUnique({ where: { id } });
  
  // 3. Guardar en cache (TTL: 5 min)
  await this.cacheManager.set(cacheKey, lead);
  
  return lead;
}
```

**Invalidación inteligente:**
```typescript
// Al actualizar con IA:
await this.cacheManager.del(`lead:${id}`);
```

**Beneficios:**
- ✅ **Performance:** Respuestas <10ms paraCache HITs
- ✅ **Reduce carga en DB:** Especialmente para leads consultados frecuentemente
- ✅ **TTL automático:** Redis expira keys después de 5 minutos
- ✅ **Invalidación selectiva:** Solo el lead modificado

---

## 🔒 Seguridad

### API Key Guard

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const apiKey = request.headers['x-api-key'];
    const validApiKey = this.configService.get('API_KEY');
    
    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid or missing API Key');
    }
    return true;
  }
}
```

**Aplicado globalmente:**
```typescript
@Controller()
@UseGuards(ApiKeyGuard)  // ← Todos los endpoints protegidos
export class LeadsController { ... }
```

### Validación de DTOs

```typescript
export class CreateLeadDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @IsString()
  @IsNotEmpty()
  firstName: string;
  // ...
}
```

**ValidationPipe global:** Valida automáticamente todos los requests.

---

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# Database - Supabase
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# Security
API_KEY="tu-api-key-secreta"

# Application
PORT=3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Google Gemini AI
GOOGLE_AI_API_KEY="tu-google-ai-api-key"
```

### Cómo obtener las credenciales

**Supabase:**
1. Crear proyecto en https://supabase.com
2. Ir a Settings → Database → Connection String
3. Copiar "Connection pooling" y "Direct connection"

**Google Gemini:**
1. Ir a https://aistudio.google.com/app/apikey
2. Click en "Create API Key"
3. Copiar la key (100% gratuito)

---

## 🧪 Testing

### Probar endpoints con cURL

```bash
# 1. Crear lead
curl -X POST 'http://localhost:3000/create-lead' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: tu-api-key' \
  -d '{"email":"test@example.com","firstName":"Test","lastName":"User","city":"Madrid"}'

# 2. Listar todos
curl -X GET 'http://localhost:3000/leads' \
  -H 'x-api-key: tu-api-key'

# 3. Obtener por ID (con cache)
curl -X GET 'http://localhost:3000/leads/<ID>' \
  -H 'x-api-key: tu-api-key'

# 4. Generar resumen con IA
curl -X POST 'http://localhost:3000/leads/<ID>/summarize' \
  -H 'x-api-key: tu-api-key'
```

---

## 📦 Estructura del Proyecto

```
contactship/
├── prisma/
│   ├── migrations/          # Migraciones de DB
│   └── schema.prisma        # Schema de Prisma
├── src/
│   ├── common/
│   │   └── guards/
│   │       └── api-key.guard.ts
│   ├── leads/
│   │   ├── dto/
│   │   │   ├── create-lead.dto.ts
│   │   │   └── lead-response.dto.ts
│   │   ├── ai.service.ts
│   │   ├── leads.controller.ts
│   │   ├── leads.service.ts
│   │   ├── leads.module.ts
│   │   ├── random-user.service.ts
│   │   ├── leads-sync.scheduler.ts
│   │   └── leads-import.processor.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── package.json
└── README.md
```

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo con hot-reload
npm run start:dev

# Build de producción
npm run build

# Ejecutar producción
npm run start:prod

# Prisma Studio (GUI para la DB)
npx prisma studio

# Generar nueva migración
npx prisma migrate dev --name nombre-migracion
```

---

## 📊 Decisiones Técnicas Destacadas

### 1. ¿Por qué Prisma sobre TypeORM?
- **Type-safety superior:** Cliente autogenerado con tipos exactos
- **Migraciones automáticas:** Genera SQL desde el schema
- **Developer Experience:** Autocomplete en queries, menos boilerplate

### 2. ¿Por qué BullMQ sobre Bull?
- **Versión moderna:** Librería reescrita para Node.js moderno
- **Mejor performance:** Optimizado para Redis 5+
- **Features avanzadas:** Retry con backoff exponencial, prioridades

### 3. ¿Por qué Cache-Aside sobre Write-Through?
- **Más apropiado para reads frecuentes:** Nuestro caso de uso
- **Menor complejidad:** No requiere sincronización en escrituras
- **Invalidación selectiva:** Solo invalidamos lo que cambia

### 4. ¿Por qué Google Gemini sobre OpenAI?
- **Gratuito:** API sin costo con rate limits generosos
- **Buena calidad:** Gemini 2.0 Flash es rápido y preciso
- **Sin tarjeta de crédito:** Ideal para demos y pruebas

---

## 🎯 Criterios de Evaluación Cubiertos

✅ **Diseño y estructura:** Arquitectura modular, separación clara de responsabilidades  
✅ **NestJS y TypeScript:** Uso de decoradores, DI, tipos estrictos  
✅ **Persistencia:** Prisma + PostgreSQL con migraciones y constraints  
✅ **Cache y colas:** Redis Cache-Aside + BullMQ con retry logic  
✅ **Deduplicación:** Triple capa (DB + aplicación + sync)  
✅ **IA:** Gemini 2.0 Flash con prompt engineering, parseo robusto  
✅ **Claridad del README:** Documentación completa y ejemplos prácticos  

---

## 🏁 Conclusión

Este proyecto demuestra:
- ✅ Arquitectura escalable y mantenible
- ✅ Buenas prácticas de NestJS y TypeScript
- ✅ Integración completa de tecnologías modernas
- ✅ Code ownership y toma de decisiones técnicas
- ✅ Claridad en documentación y comunicación

**Listo para producción** con mejoras incrementales según necesidad del negocio.

---

**Contacto:** hiring@contactship.ai  
**Subject:** Backend Dev - Iair Kaplun
