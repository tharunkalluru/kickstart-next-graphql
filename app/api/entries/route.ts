import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get Contentstack configuration
    const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
    const deliveryToken = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN;
    const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT;
    const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || 'EU';
    
    // Debug logging
    console.log('Environment variables check:', {
      apiKey: apiKey ? 'SET' : 'MISSING',
      deliveryToken: deliveryToken ? 'SET' : 'MISSING',
      environment: environment || 'MISSING',
      region
    });
    
    // Validate required environment variables
    if (!apiKey || !deliveryToken || !environment) {
      return NextResponse.json(
        { 
          error: 'Missing required environment variables',
          missing: {
            apiKey: !apiKey,
            deliveryToken: !deliveryToken,
            environment: !environment
          }
        }, 
        { status: 500 }
      );
    }
    
    // Determine the correct CDA endpoint based on region
    const baseURL = region === 'EU' ? 'eu-cdn.contentstack.com' : 'cdn.contentstack.io';
    
    // Build Contentstack CDA URL - need to specify content type
    const cdaUrl = new URL(`https://${baseURL}/v3/content_types/page/entries`);
    cdaUrl.searchParams.set('environment', environment);
    
    // Forward any query parameters from the request
    searchParams.forEach((value, key) => {
      if (key !== 'environment') { // Don't duplicate environment
        cdaUrl.searchParams.set(key, value);
      }
    });
    
    console.log('Proxying to:', cdaUrl.toString());
    
    // Make request to Contentstack CDA
    const response = await fetch(cdaUrl.toString(), {
      method: 'GET',
      headers: {
        'api_key': apiKey,
        'access_token': deliveryToken,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('CDA Response status:', response.status);
    console.log('CDA Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CDA Error response:', errorText);
      return NextResponse.json(
        { 
          error: `CDA request failed: ${response.status}`,
          details: errorText,
          url: cdaUrl.toString()
        }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('CDA Success - entries count:', data.entries?.length || 0);
    
    // Return with cache headers for Launch CDN
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'X-Proxy-Source': 'contentstack-cda',
        'X-Cache-Timestamp': new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('REST API Proxy Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch from Contentstack CDA',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}