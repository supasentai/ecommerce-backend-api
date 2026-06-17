import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

describe('CartController', () => {
  let controller: CartController;

  const mockCartService = {
    findMyCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-id',
      email: 'user@test.com',
      role: 'USER',
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call cartService.findMyCart', () => {
    const result = {
      message: 'Find my cart endpoint',
      userId: 'user-id',
    };

    mockCartService.findMyCart.mockReturnValue(result);

    expect(controller.findMyCart(mockRequest)).toEqual(result);
    expect(mockCartService.findMyCart).toHaveBeenCalledWith('user-id');
  });

  it('should call cartService.addItem', () => {
    const dto = {
      productId: 'product-id',
      quantity: 2,
    };

    const result = {
      message: 'Add item to cart endpoint',
      userId: 'user-id',
      dto,
    };

    mockCartService.addItem.mockReturnValue(result);

    expect(controller.addItem(mockRequest, dto)).toEqual(result);
    expect(mockCartService.addItem).toHaveBeenCalledWith('user-id', dto);
  });

  it('should call cartService.updateItem', () => {
    const cartItemId = 'cart-item-id';
    const dto = {
      quantity: 3,
    };

    const result = {
      message: 'Update cart item endpoint',
      userId: 'user-id',
      cartItemId,
      dto,
    };

    mockCartService.updateItem.mockReturnValue(result);

    expect(controller.updateItem(mockRequest, cartItemId, dto)).toEqual(result);
    expect(mockCartService.updateItem).toHaveBeenCalledWith(
      'user-id',
      cartItemId,
      dto,
    );
  });

  it('should call cartService.removeItem', () => {
    const cartItemId = 'cart-item-id';

    const result = {
      message: 'Remove cart item endpoint',
      userId: 'user-id',
      cartItemId,
    };

    mockCartService.removeItem.mockReturnValue(result);

    expect(controller.removeItem(mockRequest, cartItemId)).toEqual(result);
    expect(mockCartService.removeItem).toHaveBeenCalledWith(
      'user-id',
      cartItemId,
    );
  });

  it('should call cartService.clearCart', () => {
    const result = {
      message: 'Clear cart endpoint',
      userId: 'user-id',
    };

    mockCartService.clearCart.mockReturnValue(result);

    expect(controller.clearCart(mockRequest)).toEqual(result);
    expect(mockCartService.clearCart).toHaveBeenCalledWith('user-id');
  });
});
