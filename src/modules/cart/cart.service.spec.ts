import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  const mockPrismaService = {
    cartItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  const mockProduct = {
    id: 'product-id',
    name: 'Test Product',
    price: 100,
    stock: 10,
    isActive: true,
  };

  const mockCartItem = {
    id: 'cart-item-id',
    userId: 'user-id',
    productId: 'product-id',
    quantity: 2,
    product: mockProduct,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return cart items with summary', async () => {
    mockPrismaService.cartItem.findMany.mockResolvedValue([mockCartItem]);

    const result = await service.findMyCart('user-id');

    expect(result.summary).toEqual({
      totalItems: 2,
      totalAmount: 200,
    });

    expect(mockPrismaService.cartItem.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should add new item to cart', async () => {
    mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
    mockPrismaService.cartItem.findUnique.mockResolvedValue(null);
    mockPrismaService.cartItem.create.mockResolvedValue(mockCartItem);

    const result = await service.addItem('user-id', {
      productId: 'product-id',
      quantity: 2,
    });

    expect(result).toEqual(mockCartItem);
    expect(mockPrismaService.cartItem.create).toHaveBeenCalled();
  });

  it('should increase quantity when item already exists', async () => {
    const existingCartItem = {
      id: 'cart-item-id',
      quantity: 2,
    };

    const updatedCartItem = {
      ...mockCartItem,
      quantity: 4,
    };

    mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
    mockPrismaService.cartItem.findUnique.mockResolvedValue(existingCartItem);
    mockPrismaService.cartItem.update.mockResolvedValue(updatedCartItem);

    const result = await service.addItem('user-id', {
      productId: 'product-id',
      quantity: 2,
    });

    expect(result).toEqual(updatedCartItem);
    expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cart-item-id' },
        data: { quantity: 4 },
      }),
    );
  });

  it('should throw NotFoundException when product does not exist', async () => {
    mockPrismaService.product.findUnique.mockResolvedValue(null);

    await expect(
      service.addItem('user-id', {
        productId: 'invalid-product-id',
        quantity: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when product is inactive', async () => {
    mockPrismaService.product.findUnique.mockResolvedValue({
      ...mockProduct,
      isActive: false,
    });

    await expect(
      service.addItem('user-id', {
        productId: 'product-id',
        quantity: 1,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when quantity exceeds stock', async () => {
    mockPrismaService.product.findUnique.mockResolvedValue({
      ...mockProduct,
      stock: 1,
    });

    await expect(
      service.addItem('user-id', {
        productId: 'product-id',
        quantity: 2,
      }),
    ).rejects.toThrow(BadRequestException);
  });
  it('should update cart item quantity', async () => {
    const cartItem = {
      ...mockCartItem,
      product: mockProduct,
    };

    const updatedCartItem = {
      ...mockCartItem,
      quantity: 3,
    };

    mockPrismaService.cartItem.findFirst.mockResolvedValue(cartItem);
    mockPrismaService.cartItem.update.mockResolvedValue(updatedCartItem);

    const result = await service.updateItem('user-id', 'cart-item-id', {
      quantity: 3,
    });

    expect(result).toEqual(updatedCartItem);
    expect(mockPrismaService.cartItem.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'cart-item-id',
        userId: 'user-id',
      },
      include: {
        product: true,
      },
    });
    expect(mockPrismaService.cartItem.update).toHaveBeenCalled();
  });

  it('should throw NotFoundException when updating missing cart item', async () => {
    mockPrismaService.cartItem.findFirst.mockResolvedValue(null);

    await expect(
      service.updateItem('user-id', 'missing-id', {
        quantity: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("should reject updating another user's cart item", async () => {
    mockPrismaService.cartItem.findFirst.mockResolvedValue(null);

    await expect(
      service.updateItem('user-id', 'other-user-cart-item-id', {
        quantity: 1,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrismaService.cartItem.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'other-user-cart-item-id',
        userId: 'user-id',
      },
      include: {
        product: true,
      },
    });
    expect(mockPrismaService.cartItem.update).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when updated quantity exceeds stock', async () => {
    mockPrismaService.cartItem.findFirst.mockResolvedValue({
      ...mockCartItem,
      product: {
        ...mockProduct,
        stock: 2,
      },
    });

    await expect(
      service.updateItem('user-id', 'cart-item-id', {
        quantity: 3,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should remove cart item', async () => {
    mockPrismaService.cartItem.findFirst.mockResolvedValue(mockCartItem);
    mockPrismaService.cartItem.delete.mockResolvedValue(mockCartItem);

    const result = await service.removeItem('user-id', 'cart-item-id');

    expect(result).toEqual({
      message: 'Cart item removed successfully',
    });

    expect(mockPrismaService.cartItem.delete).toHaveBeenCalledWith({
      where: {
        id: 'cart-item-id',
      },
    });
  });

  it('should throw NotFoundException when removing missing cart item', async () => {
    mockPrismaService.cartItem.findFirst.mockResolvedValue(null);

    await expect(service.removeItem('user-id', 'missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should clear cart', async () => {
    mockPrismaService.cartItem.deleteMany.mockResolvedValue({
      count: 2,
    });

    const result = await service.clearCart('user-id');

    expect(result).toEqual({
      message: 'Cart cleared successfully',
    });

    expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
      },
    });
  });
});
