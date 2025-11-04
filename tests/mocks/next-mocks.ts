
import { NextRequest } from 'next/server';

interface NextRequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  url?: string;
}

interface MockNextResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
  sent: boolean;
  json: (data: any, options?: { status?: number }) => {
    json: () => Promise<any>;
    status: number;
    headers: Headers;
  };
}

/**
 * Creates a mock for the NextRequest
 * @param options Request options
 * @returns NextRequest-like object
 */
export function createMockNextRequest(options: any = {}): NextRequest {
  const { method = 'GET', body = null, headers = {}, url = 'http://localhost' } = options;
  
  
  const headersObj = new Headers(headers);
  
  
  const urlObj = new URL(url);
  
  
  const request = new Request(url, {
    method,
    headers: headersObj
  });
  
  
  const nextRequest = request as unknown as NextRequest;
  
  
  Object.defineProperty(nextRequest, 'nextUrl', {
    get: () => urlObj,
    enumerable: true
  });
  
  Object.defineProperty(nextRequest, 'json', {
    value: async () => body,
    enumerable: true
  });
  
  Object.defineProperty(nextRequest, 'text', {
    value: async () => JSON.stringify(body),
    enumerable: true
  });
  
  return nextRequest;
}

/**
 * Creates a mock NextResponse
 * @returns Mock object with functions to track usage
 */
export function createNextResponseMock(): MockNextResponse {
  const responseMock: MockNextResponse = {
    status: 200,
    body: null,
    headers: {},
    sent: false,
    
    json: jest.fn((data, options = {}) => {
      responseMock.body = data;
      responseMock.status = options.status || 200;
      responseMock.sent = true;
      return { 
        json: async () => data,
        status: options.status || 200,
        headers: new Headers(responseMock.headers)
      };
    })
  };
  
  return responseMock;
} 