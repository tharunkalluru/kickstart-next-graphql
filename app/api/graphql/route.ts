import { NextRequest, NextResponse } from 'next/server';

// Support both GET and POST for GraphQL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract GraphQL parameters from URL
    const query = searchParams.get('query');
    const variables = searchParams.get('variables');
    const operationName = searchParams.get('operationName');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' }, 
        { status: 400 }
      );
    }
    
    // Build Contentstack GraphQL GET URL
    const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
    const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT;
    const accessToken = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN;
    const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || 'EU';
    
    const baseURL = region === 'NA' ? 'graphql.contentstack.com' : 'graphql.contentstack.com';
    
    // Construct the GET URL with parameters
    const graphqlUrl = new URL(`https://${baseURL}/stacks/${apiKey}`);
    graphqlUrl.searchParams.set('environment', environment!);
    graphqlUrl.searchParams.set('query', query);
    
    if (variables) {
      graphqlUrl.searchParams.set('variables', variables);
    }
    
    if (operationName) {
      graphqlUrl.searchParams.set('operationName', operationName);
    }
    
    // Make GET request to Contentstack GraphQL API
    const response = await fetch(graphqlUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': accessToken!,
        // Forward additional headers if needed
        ...(request.headers.get('branch') && {
          'branch': request.headers.get('branch')!
        }),
      },
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
    
  } catch (error) {
    console.error('GraphQL GET Proxy Error:', error);
    return NextResponse.json(
      { error: 'GraphQL request failed' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the GraphQL query from the request body
    const body = await request.json();
    
    // Your Contentstack GraphQL endpoint
    const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
    const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT;
    const accessToken = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN;
    const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || 'EU';
    
    // Determine the correct GraphQL endpoint based on region
    const baseURL = region === 'EU' ? 'eu-graphql.contentstack.com' : 'graphql.contentstack.com';
    const graphqlEndpoint = `https://${baseURL}/stacks/${apiKey}?environment=${environment}`;
    
    // Forward the POST request to Contentstack's GraphQL API
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': accessToken!,
        // Forward any additional headers if needed
        ...(request.headers.get('live_preview') && {
          'live_preview': request.headers.get('live_preview')!
        }),
        ...(request.headers.get('preview_token') && {
          'preview_token': request.headers.get('preview_token')!
        }),
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // Return the GraphQL response
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
    
  } catch (error) {
    console.error('GraphQL POST Proxy Error:', error);
    return NextResponse.json(
      { error: 'GraphQL request failed' }, 
      { status: 500 }
    );
  }
}