import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabase';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { rawLog, executionTimeMs } = await request.json();

    if (!rawLog) {
      return NextResponse.json({ success: false, error: 'Missing raw log data' }, { status: 400 });
    }

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this raw PostgreSQL EXPLAIN ANALYZE plan. Extract the absolute biggest performance bottleneck and suggest an action item.
      
      Raw Log:
      ${rawLog}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            bottleneck: { 
              type: 'STRING', 
              description: 'The type of bottleneck detected, e.g., Sequential Scan, Nested Loop, Missing Index.' 
            },
            table: { 
              type: 'STRING', 
              description: 'The exact database table name where the bottleneck occurred.' 
            },
            remediation: { 
              type: 'STRING', 
              description: 'Clear, direct advice on how to fix it along with the exact single-line SQL command needed, like CREATE INDEX...' 
            },
            severity: {
              type: 'STRING',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              description: 'The performance impact classification.'
            }
          },
          required: ['bottleneck', 'table', 'remediation', 'severity']
        }
      }
    });

    const summaryJson = JSON.parse(aiResponse.text || '{}');

    const { data, error } = await supabase
      .from('query_logs')
      .insert([
        { 
          raw_explain_text: rawLog, 
          execution_time_ms: executionTimeMs || 0, 
          summary_json: summaryJson 
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: data[0] });

  } catch (err: any) {
    console.error('Pipeline Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}