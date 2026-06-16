import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  register() {
    return {
      message: 'Register endpoint is working',
    };
  }

  login() {
    return {
      message: 'Login endpoint is working',
    };
  }
}
