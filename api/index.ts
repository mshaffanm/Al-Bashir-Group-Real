import 'dotenv/config';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { getSurveys, addSurvey, deleteSurvey, getQuestions, addQuestion, updateQuestion, deleteQuestion, getAdvisors, addAdvisor, deleteAdvisor } from '../db.js';

const app = express();
app.use(express.json());

// API: Get all surveys
app.get('/api/surveys', async (req, res) => {
  try {
    const surveys = await getSurveys();
    res.json(surveys);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve surveys.' });
  }
});

// API: Save new survey with dynamic parameters
app.post('/api/surveys', async (req, res) => {
  try {
    const { customerName, regNumber, advisorName, remarks, ...ratings } = req.body;

    if (!customerName || !regNumber || !advisorName) {
      return res.status(400).json({ error: 'Customer Name, Registration Number, and Advisor Name are required.' });
    }

    const questionsList = await getQuestions();
    const sanitizedRatings: { [key: string]: number } = {};

    questionsList.forEach(q => {
      const val = ratings[q.id];
      sanitizedRatings[q.id] = (val !== undefined && val !== null) ? Number(val) : 10;
    });

    const saved = await addSurvey({
      customerName,
      regNumber,
      advisorName,
      remarks: remarks || '',
      ...sanitizedRatings
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save survey.' });
  }
});

// API: Delete survey
app.delete('/api/surveys/:id', async (req, res) => {
  try {
    const success = await deleteSurvey(req.params.id);
    if (success) {
      res.json({ message: 'Survey deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Survey not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete survey.' });
  }
});

// API: Get all questions
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await getQuestions();
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
});

// API: Add new question
app.post('/api/questions', async (req, res) => {
  try {
    const { header, label, description } = req.body;
    if (!header || !label) {
      return res.status(400).json({ error: 'Question short header and full label are required.' });
    }
    const saved = await addQuestion({ header, label, description: description || '' });
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save question.' });
  }
});

// API: Update question
app.put('/api/questions/:id', async (req, res) => {
  try {
    const { header, label, description } = req.body;
    const updated = await updateQuestion(req.params.id, { header, label, description });
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Question not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

// API: Delete question
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const success = await deleteQuestion(req.params.id);
    if (success) {
      res.json({ message: 'Question deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Question not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete question.' });
  }
});

// API: Get all advisors
app.get('/api/advisors', async (req, res) => {
  try {
    const advisors = await getAdvisors();
    res.json(advisors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve advisors.' });
  }
});

// API: Add new advisor
app.post('/api/advisors', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Advisor name is required.' });
    }
    const saved = await addAdvisor({ name: name.trim() });
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save advisor.' });
  }
});

// API: Delete advisor
app.delete('/api/advisors/:name', async (req, res) => {
  try {
    const success = await deleteAdvisor(req.params.name);
    if (success) {
      res.json({ message: 'Advisor deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Advisor not found.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete advisor.' });
  }
});

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required but was not provided.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API: Parse unstructured text feedback into survey using Gemini
app.post('/api/gemini/parse-survey', async (req, res) => {
  try {
    const { feedback } = req.body;
    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback text is required.' });
    }

    const ai = getGeminiClient();
    const questionsList = await getQuestions();
    const advisorsList = await getAdvisors();
    const advisorsNames = advisorsList.map(a => a.name).join(', ');

    const parametersInstruction = questionsList.map((q) => {
      return `   - ${q.id}: ${q.label} - ${q.description}`;
    }).join('\n');

    const systemInstruction = `
You are a CRM (Customer Relationship Management) assistant at Al-Bashir Group.
Your task is to analyze unstructured customer feedback (or a call transcription/note) and extract:
1. Customer Name (look for words indicating a name, if not present make a best guess or leave blank)
2. Registration Number / License Plate (e.g., ACV-201, FSD-9999, etc.)
3. Service Advisor Name (e.g., ${advisorsNames}. If it resembles any of these, map it to the correct one).
4. Sentiment scores (integer 1-10) for these parameters:
${parametersInstruction}
5. Key Customer Remarks Summary (a concise synthesis of what they liked/disliked).

Scoring Guidelines (1 to 10):
- If the customer explicitly praises a category, score it 9 or 10 (e.g., "advisor listened beautifully and was polite" -> advisorCourtesy = 10).
- If they complain heavily, score it 1 to 5 (e.g., "no cooling in lounge, flies everywhere" -> loungeComfort = 3).
- If they mention minor dissatisfaction or a gap, score it 6 to 8 (e.g., "car was late by an hour" -> onTimeDelivery = 7).
- If a parameter is NOT mentioned at all, default it to a high satisfaction score like 10, or 9, as is typical for neutral non-complaints at Al-Bashir Group, unless there is a global negative sentiment.
`;

    const schemaProperties: any = {
      customerName: {
        type: Type.STRING,
        description: "Customer's name, or empty string if not found.",
      },
      regNumber: {
        type: Type.STRING,
        description: 'Vehicle Registration/License Number (e.g., ACV-201, FSD-1234), or empty string if not found.',
      },
      advisorName: {
        type: Type.STRING,
        description: `Service advisor name, must match or resemble one of: ${advisorsNames}. Default to an empty string if not found.`,
      },
      remarks: {
        type: Type.STRING,
        description: 'Concise summary of customer comments (Voice of Customer / VOC).',
      }
    };

    questionsList.forEach(q => {
      schemaProperties[q.id] = {
        type: Type.INTEGER,
        description: `Rating 1-10 on parameter "${q.label}" (${q.description}).`
      };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Please analyze the following customer feedback: "${feedback}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'customerName',
            'regNumber',
            'advisorName',
            ...questionsList.map(q => q.id),
            'remarks',
          ],
          properties: schemaProperties,
        },
      },
    });

    const parsedText = response.text;
    if (!parsedText) {
      return res.status(500).json({ error: 'Failed to generate output from Gemini.' });
    }

    res.json(JSON.parse(parsedText.trim()));
  } catch (error: any) {
    console.error('Gemini survey parser error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse feedback with Gemini.' });
  }
});

export default app;