"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
let AiService = AiService_1 = class AiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AiService_1.name);
        const apiKey = this.configService.get('GOOGLE_AI_API_KEY');
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    async generateLeadSummary(leadData) {
        try {
            const prompt = `
Eres un asistente de ventas. Analiza la siguiente información de un lead y genera:
1. Un resumen breve (1-2 líneas) del perfil del lead
2. Una acción recomendada para el próximo contacto

Lead:
- Nombre: ${leadData.firstName} ${leadData.lastName}
- Email: ${leadData.email}
- Teléfono: ${leadData.phone || 'No disponible'}
- Ubicación: ${leadData.city || 'Desconocida'}, ${leadData.country || 'Desconocido'}

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "summary": "tu resumen aquí",
  "next_action": "tu acción recomendada aquí"
}

No incluyas ningún texto adicional, solo el JSON.
`.trim();
            this.logger.log(`Generating AI summary for lead: ${leadData.email}`);
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            this.logger.log(`AI Response: ${text}`);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('AI response is not valid JSON');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.summary || 'No summary available',
                next_action: parsed.next_action || 'No action suggested',
            };
        }
        catch (error) {
            this.logger.error('Error generating AI summary', error);
            throw error;
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map