import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return find my cart skeleton response', () => {
    expect(service.findMyCart('user-id')).toEqual({
      message: 'Find my cart endpoint',
      userId: 'user-id',
    });
  });

  it('should return add item skeleton response', () => {
    const dto = {
      productId: 'product-id',
      quantity: 2,
    };

    expect(service.addItem('user-id', dto)).toEqual({
      message: 'Add item to cart endpoint',
      userId: 'user-id',
      dto,
    });
  });

  it('should return update item skeleton response', () => {
    const dto = {
      quantity: 3,
    };

    expect(service.updateItem('user-id', 'cart-item-id', dto)).toEqual({
      message: 'Update cart item endpoint',
      userId: 'user-id',
      cartItemId: 'cart-item-id',
      dto,
    });
  });

  it('should return remove item skeleton response', () => {
    expect(service.removeItem('user-id', 'cart-item-id')).toEqual({
      message: 'Remove cart item endpoint',
      userId: 'user-id',
      cartItemId: 'cart-item-id',
    });
  });

  it('should return clear cart skeleton response', () => {
    expect(service.clearCart('user-id')).toEqual({
      message: 'Clear cart endpoint',
      userId: 'user-id',
    });
  });
});
