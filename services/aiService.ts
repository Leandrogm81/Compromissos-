import { GoogleGenAI, Type } from '@google/genai';

interface AiSuggestion {
    title: string;
    description: string;
    datetime: string; // ISO format
}

// Fix: Use the `Type` enum from @google/genai for responseSchema instead of string literals.
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'O título do lembrete. Deve ser conciso.' },
        description: { type: Type.STRING, description: 'Uma descrição mais detalhada do lembrete.' },
        datetime: { type: Type.STRING, description: `A data e hora do lembrete no formato ISO 8601 UTC (ex: ${new Date().toISOString()}). Considere o dia de hoje como referência se não houver data explícita.`},
    },
    required: ["title", "datetime"],
};

export async function suggestReminderFields(text: string, currentTitle?: string): Promise<AiSuggestion> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API key for Gemini not found.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const todayInBrazil = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  let prompt = `
    Analise o texto do usuário para extrair informações para um lembrete.
    O fuso horário é São Paulo (America/Sao_Paulo). A data de hoje é ${todayInBrazil}.
    Responda estritamente com um JSON contendo "title", "description" e "datetime".
  `;

  if (currentTitle) {
    // If title exists, keep it. AI should focus on description and date from the new text.
    prompt += `
      O título do lembrete já foi definido como: "${currentTitle}". Você NÃO DEVE alterar este título.
      O texto a ser analisado para extrair a descrição e a data/hora é: "${text}".
      
      - Mantenha "title" exatamente como "${currentTitle}".
      - Extraia uma "description" detalhada do texto.
      - Extraia o "datetime" no formato ISO 8601 UTC.
    `;
  } else {
    // If title does not exist, AI should create a summarized title.
    prompt += `
      O texto a ser analisado é: "${text}".
      
      - Crie um "title" CURTO e OBJETIVO que resuma o texto. Não copie o texto inteiro para o título.
      - Extraia uma "description" detalhada do texto. Se o texto for curto, a descrição pode ser igual ao texto original.
      - Extraia o "datetime" no formato ISO 8601 UTC.
    `;
  }


  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AiSuggestion;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Não foi possível obter sugestões da IA.");
  }
}

export async function processVoiceTranscript(transcript: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.log("AI processing for voice disabled. API_KEY not provided.");
    return transcript;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Sua tarefa é atuar como um corretor ortográfico e gramatical. Você receberá um texto que foi transcrito de uma gravação de voz.
    NÃO altere o significado ou o estilo do texto. NÃO adicione palavras que não foram ditas.
    Sua única função é:
    1. Corrigir erros de ortografia e gramática.
    2. Adicionar pontuação (vírgulas, pontos finais, etc.) para tornar o texto coerente e legível.
    3. Manter a estrutura das frases o mais próximo possível do original.
    A resposta deve conter APENAS o texto corrigido.

    Texto para corrigir: "${transcript}"
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API for voice processing:", error);
    // Fallback to the original transcript on error
    return transcript;
  }
}