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

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Fetch Logs Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing log record identifier' }, { status: 400 });
    }

    const { error } = await supabase
      .from('query_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Log dropped successfully' });
  } catch (err: any) {
    console.error('Delete Log Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}