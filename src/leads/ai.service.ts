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
    if (!apiKey) {
      this.logger.warn('GOOGLE_AI_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
      const prompt = `Eres un asistente de ventas. Analiza la siguiente información de un lead y genera:
1. Un resumen breve (1-2 líneas) del perfil del lead
2. Una acción recomendada para el próximo contacto

Lead:
- Nombre: ${leadData.firstName} ${leadData.lastName}
- Email: ${leadData.email}
- Teléfono: ${leadData.phone || 'No disponible'}
- Ubicación: ${leadData.city || 'Desconocida'}, ${leadData.country || 'Desconocido'}

Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "summary": "tu resumen aquí",
  "next_action": "tu acción recomendada aquí"
}`;

      this.logger.log(`Generating AI summary for lead: ${leadData.email}`);
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      this.logger.log(`AI Raw Response: ${text.substring(0, 200)}...`);

      // Intentar parsear JSON de diferentes formas
      let parsed;
      try {
        // Primero intentar parsear directo
        parsed = JSON.parse(text);
      } catch {
        // Si falla, buscar el JSON en el texto
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: generar respuesta default
          this.logger.warn('Could not parse AI response, using fallback');
          return {
            summary: `Lead ${leadData.firstName} ${leadData.lastName} de ${leadData.city || 'ubicación desconocida'}`,
            next_action: 'Contactar por email para presentar servicios',
          };
        }
      }

      return {
        summary: parsed.summary || `Lead from ${leadData.city || 'unknown location'}`,
        next_action: parsed.next_action || 'Follow up via email',
      };
    } catch (error) {
      this.logger.error(`Error generating AI summary: ${error.message}`, error.stack);
      
      // Fallback response
      return {
        summary: `Lead ${leadData.firstName} ${leadData.lastName} from ${leadData.city || 'unknown location'}`,
        next_action: 'Contact lead to discuss services',
      };
    }
  }
}

