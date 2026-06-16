import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  findAll() {
    return {
      message: 'Products endpoint is working',
      data: [],
    };
  }
}
