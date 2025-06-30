import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get Contentstack configuration
    const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
    const deliveryToken = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN;
    const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT;
    const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || 'EU';
    
    // Determine the correct CDA endpoint based on region
    const baseURL = region === 'NA' ? 'cdn.contentstack.com' : 'cdn.contentstack.io';
    
    // Build Contentstack CDA URL for assets
    const cdaUrl = new URL(`https://${baseURL}/v3/assets`);
    cdaUrl.searchParams.set('environment', environment!);
    
    // Forward any query parameters from the request
    searchParams.forEach((value, key) => {
      if (key !== 'environment') {
        cdaUrl.searchParams.set(key, value);
      }
    });
    
    console.log('Assets API - Proxying to:', cdaUrl.toString());
    
    // Make request to Contentstack CDA
    const response = await fetch(cdaUrl.toString(), {
      method: 'GET',
      headers: {
        'api_key': apiKey!,
        'access_token': deliveryToken!,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Assets CDA request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return with cache headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=120', // 10 min cache for assets
        'X-Proxy-Source': 'contentstack-assets',
        'X-Cache-Timestamp': new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Assets API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets from Contentstack CDA' }, 
      { status: 500 }
    );
  }
}