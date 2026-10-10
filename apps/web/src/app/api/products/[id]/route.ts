import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(decodeURIComponent(id));
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  return NextResponse.json(product);
}
