import { NextRequest } from 'next/server';

declare module 'next/server' {
  export type NextRouteHandlerContext<T = Record<string, string>> = {
    params: T;
  };
} 