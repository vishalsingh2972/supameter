import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('query_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Fetch Logs Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}