import { BadRequestException, NotFoundException } from '@nestjs/common';

const messages: Record<string, string> = {
  'errors.common.userNotFound': 'User not found',
  'errors.auth.verificationFailed': 'Verify token invalid',
  'errors.auth.tokenExpired': 'Verify token expired',
  'errors.auth.emailMismatch': 'Email and verify token mismatch',
};

// get error message from error code
export function translateApiMessage(key: string): string {
  return messages[key] ?? key;
}

// handle error bad request throwing
export function apiBadRequest(key: string): never {
  throw new BadRequestException(translateApiMessage(key));
}

// handle error not found throwing
export function apiNotFound(key: string): never {
  throw new NotFoundException(translateApiMessage(key));
}
