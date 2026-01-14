import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AiSummaryResult {
  summary: string;
  next_action: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateLeadSummary(leadData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city?: string;
    country?: string;
  }): Promise<AiSummaryResult> {
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

      // Parsear JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI response is not valid JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        summary: parsed.summary || 'No summary available',
        next_action: parsed.next_action || 'No action suggested',
      };
    } catch (error) {
      this.logger.error('Error generating AI summary', error);
      throw error;
    }
  }
}
