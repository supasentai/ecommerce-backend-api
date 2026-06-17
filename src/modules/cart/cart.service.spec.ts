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
});
