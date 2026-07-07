import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabase';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { rawLog, executionTimeMs } = await request.json();

    if (!rawLog) {
      return NextResponse.json({ success: false, error: 'Missing raw log data' }, { status: 400 });
    }

    const responseStream = await ai.models.generateContentStream({
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

    const encoder = new TextEncoder();
    
    const customStream = new ReadableStream({
      async start(controller) {
        let completeTextAccumulator = '';

        for await (const chunk of responseStream) {
          const textChunk = chunk.text;
          if (textChunk) {
            completeTextAccumulator += textChunk;
            controller.enqueue(encoder.encode(textChunk));
          }
        }

        try {
          const parsedSummaryJson = JSON.parse(completeTextAccumulator || '{}');
          
          const { data, error } = await supabase
            .from('query_logs')
            .insert([
              { 
                raw_explain_text: rawLog, 
                execution_time_ms: executionTimeMs || 0, 
                summary_json: parsedSummaryJson 
              }
            ])
            .select();

          if (error) throw error;

          const metadataPayload = `\n__METADATA__:${JSON.stringify(data[0])}`;
          controller.enqueue(encoder.encode(metadataPayload));
        } catch (dbErr) {
          console.error('Stream close database persistence exception:', dbErr);
        }

        controller.close();
      }
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (err: any) {
    console.error('Pipeline Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}