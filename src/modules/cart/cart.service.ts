import { Injectable } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  findMyCart(userId: string) {
    return {
      message: 'Find my cart endpoint',
      userId,
    };
  }

  addItem(userId: string, dto: AddToCartDto) {
    return {
      message: 'Add item to cart endpoint',
      userId,
      dto,
    };
  }

  updateItem(userId: string, cartItemId: string, dto: UpdateCartItemDto) {
    return {
      message: 'Update cart item endpoint',
      userId,
      cartItemId,
      dto,
    };
  }

  removeItem(userId: string, cartItemId: string) {
    return {
      message: 'Remove cart item endpoint',
      userId,
      cartItemId,
    };
  }

  clearCart(userId: string) {
    return {
      message: 'Clear cart endpoint',
      userId,
    };
  }
}
