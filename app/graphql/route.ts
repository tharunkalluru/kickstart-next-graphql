import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const response = await fetch('https://graphql.contentstack.com/stacks/NEXT_PUBLIC_CONTENTSTACK_API_KEY?environment=preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN!,
    },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}