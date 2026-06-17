import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    cartItem: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    orderItem: {
      createMany: jest.fn(),
    },
    product: {
      update: jest.fn(),
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
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    mockPrismaService.$transaction.mockImplementation((arg) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }

      return arg(mockPrismaService);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException when cart is empty', async () => {
    mockPrismaService.cartItem.findMany.mockResolvedValue([]);

    await expect(service.checkout('user-id')).rejects.toThrow(
      BadRequestException,
    );

    expect(mockPrismaService.cartItem.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      include: { product: true },
    });
    expect(mockPrismaService.order.create).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when product is inactive', async () => {
    mockPrismaService.cartItem.findMany.mockResolvedValue([
      {
        ...mockCartItem,
        product: {
          ...mockProduct,
          isActive: false,
        },
      },
    ]);

    await expect(service.checkout('user-id')).rejects.toThrow(
      BadRequestException,
    );

    expect(mockPrismaService.order.create).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when stock is insufficient', async () => {
    mockPrismaService.cartItem.findMany.mockResolvedValue([
      {
        ...mockCartItem,
        quantity: 3,
        product: {
          ...mockProduct,
          stock: 2,
        },
      },
    ]);

    await expect(service.checkout('user-id')).rejects.toThrow(
      BadRequestException,
    );

    expect(mockPrismaService.order.create).not.toHaveBeenCalled();
  });

  it('should create order, order items, update stock, and clear cart', async () => {
    const secondCartItem = {
      id: 'cart-item-id-2',
      userId: 'user-id',
      productId: 'product-id-2',
      quantity: 1,
      product: {
        ...mockProduct,
        id: 'product-id-2',
        price: '50.5',
        stock: 5,
      },
    };

    const createdOrder = {
      id: 'order-id',
      userId: 'user-id',
      status: OrderStatus.PENDING,
      totalAmount: 250.5,
    };

    const returnedOrder = {
      ...createdOrder,
      items: [
        {
          id: 'order-item-id',
          orderId: 'order-id',
          productId: 'product-id',
          quantity: 2,
          price: 100,
          product: mockProduct,
        },
      ],
    };

    mockPrismaService.cartItem.findMany.mockResolvedValue([
      mockCartItem,
      secondCartItem,
    ]);
    mockPrismaService.order.create.mockResolvedValue(createdOrder);
    mockPrismaService.orderItem.createMany.mockResolvedValue({ count: 2 });
    mockPrismaService.product.update.mockResolvedValue({});
    mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 2 });
    mockPrismaService.order.findUnique.mockResolvedValue(returnedOrder);

    await expect(service.checkout('user-id')).resolves.toEqual(returnedOrder);

    expect(mockPrismaService.$transaction).toHaveBeenCalled();
    expect(mockPrismaService.order.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        status: OrderStatus.PENDING,
        totalAmount: 250.5,
      },
    });
    expect(mockPrismaService.orderItem.createMany).toHaveBeenCalledWith({
      data: [
        {
          orderId: 'order-id',
          productId: 'product-id',
          quantity: 2,
          price: 100,
        },
        {
          orderId: 'order-id',
          productId: 'product-id-2',
          quantity: 1,
          price: '50.5',
        },
      ],
    });
    expect(mockPrismaService.product.update).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      data: {
        stock: {
          decrement: 2,
        },
      },
    });
    expect(mockPrismaService.product.update).toHaveBeenCalledWith({
      where: { id: 'product-id-2' },
      data: {
        stock: {
          decrement: 1,
        },
      },
    });
    expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
    });
    expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'order-id' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  });

  it('should cancel pending order and restore stock', async () => {
    const order = {
      id: 'order-id',
      userId: 'user-id',
      status: OrderStatus.PENDING,
      items: [
        {
          id: 'order-item-id',
          orderId: 'order-id',
          productId: 'product-id',
          quantity: 2,
          price: 100,
        },
      ],
    };

    const cancelledOrder = {
      ...order,
      status: OrderStatus.CANCELLED,
      items: [
        {
          ...order.items[0],
          product: mockProduct,
        },
      ],
    };

    mockPrismaService.order.findFirst.mockResolvedValue(order);
    mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaService.product.update.mockResolvedValue(mockProduct);
    mockPrismaService.order.findUnique.mockResolvedValue(cancelledOrder);

    await expect(
      service.cancelMyOrder('user-id', 'order-id'),
    ).resolves.toEqual(cancelledOrder);

    expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'order-id',
        userId: 'user-id',
      },
      include: {
        items: true,
      },
    });
    expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-id',
        userId: 'user-id',
        status: OrderStatus.PENDING,
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });
    expect(mockPrismaService.product.update).toHaveBeenCalledWith({
      where: {
        id: 'product-id',
      },
      data: {
        stock: {
          increment: 2,
        },
      },
    });
    expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'order-id',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  });

  it('should throw BadRequestException when cancelling non-pending order', async () => {
    mockPrismaService.order.findFirst.mockResolvedValue({
      id: 'order-id',
      userId: 'user-id',
      status: OrderStatus.PAID,
      items: [
        {
          id: 'order-item-id',
          orderId: 'order-id',
          productId: 'product-id',
          quantity: 2,
          price: 100,
        },
      ],
    });

    await expect(service.cancelMyOrder('user-id', 'order-id')).rejects.toThrow(
      BadRequestException,
    );

    expect(mockPrismaService.order.updateMany).not.toHaveBeenCalled();
    expect(mockPrismaService.product.update).not.toHaveBeenCalled();
  });

  it('should return paginated user orders', async () => {
    const orders = [
      {
        id: 'order-id',
        userId: 'user-id',
        status: OrderStatus.PENDING,
        items: [],
      },
    ];

    mockPrismaService.order.findMany.mockResolvedValue(orders);
    mockPrismaService.order.count.mockResolvedValue(1);

    await expect(service.findMyOrders('user-id', {})).resolves.toEqual({
      data: orders,
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

    expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      skip: 0,
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: true,
      },
    });
    expect(mockPrismaService.order.count).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
    });
  });

  it('should return user order detail', async () => {
    const order = {
      id: 'order-id',
      userId: 'user-id',
      status: OrderStatus.PENDING,
      items: [],
    };

    mockPrismaService.order.findFirst.mockResolvedValue(order);

    await expect(service.findMyOrder('user-id', 'order-id')).resolves.toEqual(
      order,
    );

    expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'order-id',
        userId: 'user-id',
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  });
});
