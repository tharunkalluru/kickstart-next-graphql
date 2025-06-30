import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // Get Contentstack configuration
    const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
    const deliveryToken = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN;
    const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT;
    const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || 'EU';
    
    // Return debug info
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment_variables: {
        apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING',
        deliveryToken: deliveryToken ? `${deliveryToken.substring(0, 8)}...` : 'MISSING',
        environment: environment || 'MISSING',
        region
      },
      test_urls: {
        cda_base: region === 'EU' ? 'eu-cdn.contentstack.com' : 'cdn.contentstack.io',
        test_endpoint: `https://${region === 'EU' ? 'eu-cdn.contentstack.com' : 'cdn.contentstack.io'}/v3/entries?environment=${environment}&limit=1`
      }
    };
    
    // Test a simple CDA request
    if (apiKey && deliveryToken && environment) {
      try {
        const testUrl = `https://${region === 'EU' ? 'eu-cdn.contentstack.com' : 'cdn.contentstack.io'}/v3/entries?environment=${environment}&limit=1`;
        
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'api_key': apiKey,
            'access_token': deliveryToken,
            'Content-Type': 'application/json',
          },
        });
        
        debugInfo.test_result = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          headers: Object.fromEntries(testResponse.headers.entries())
        };
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          debugInfo.test_result.entries_count = testData.entries?.length || 0;
          debugInfo.test_result.success = true;
        } else {
          debugInfo.test_result.error = await testResponse.text();
          debugInfo.test_result.success = false;
        }
        
      } catch (testError) {
        debugInfo.test_result = {
          success: false,
          error: testError instanceof Error ? testError.message : 'Unknown error'
        };
      }
    }
    
    return NextResponse.json(debugInfo, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}