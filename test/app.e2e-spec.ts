import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

const now = () => new Date();

function pickFields<T extends Record<string, unknown>>(
  item: T,
  select?: Record<string, boolean>,
) {
  if (!select) {
    return item;
  }

  return Object.fromEntries(
    Object.entries(select)
      .filter(([, selected]) => selected)
      .map(([key]) => [key, item[key]]),
  );
}

function createInMemoryPrisma() {
  const category = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Seed Category',
    slug: 'seed-category',
    createdAt: now(),
    updatedAt: now(),
  };

  const product = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Seed Product',
    slug: 'seed-product',
    description: 'Seed product for checkout flow',
    price: 100,
    stock: 10,
    imageUrl: null,
    isActive: true,
    categoryId: category.id,
    category,
    createdAt: now(),
    updatedAt: now(),
  };

  const state = {
    users: [] as any[],
    cartItems: [] as any[],
    orders: [] as any[],
    orderItems: [] as any[],
    products: [product],
    categories: [category],
  };

  let idSequence = 1;
  const nextId = (prefix: string) => `${prefix}-${idSequence++}`;

  const withProduct = (item: any) => ({
    ...item,
    product: state.products.find((stored) => stored.id === item.productId),
  });

  const withOrderItems = (order: any, includeProduct = false) => ({
    ...order,
    items: state.orderItems
      .filter((item) => item.orderId === order.id)
      .map((item) => (includeProduct ? withProduct(item) : item)),
  });

  const prisma: any = {
    state,
    $connect: jest.fn(),
    $transaction: jest.fn((arg: any) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }

      return arg(prisma);
    }),
    user: {
      findUnique: jest.fn(async ({ where, select }) => {
        const user = state.users.find(
          (stored) =>
            (where.email && stored.email === where.email) ||
            (where.id && stored.id === where.id),
        );

        return user ? pickFields(user, select) : null;
      }),
      create: jest.fn(async ({ data, select }) => {
        const user = {
          id: nextId('user'),
          email: data.email,
          password: data.password,
          name: data.name ?? null,
          role: Role.USER,
          createdAt: now(),
          updatedAt: now(),
        };

        state.users.push(user);

        return pickFields(user, select);
      }),
    },
    product: {
      findUnique: jest.fn(async ({ where }) => {
        return state.products.find((stored) => stored.id === where.id) ?? null;
      }),
      update: jest.fn(async ({ where, data }) => {
        const stored = state.products.find((item) => item.id === where.id);

        if (!stored) {
          return null;
        }

        if (data.stock?.decrement) {
          stored.stock -= data.stock.decrement;
        }

        if (data.stock?.increment) {
          stored.stock += data.stock.increment;
        }

        Object.assign(stored, {
          ...data,
          stock: stored.stock,
          updatedAt: now(),
        });

        return stored;
      }),
    },
    cartItem: {
      findUnique: jest.fn(async ({ where }) => {
        return (
          state.cartItems.find(
            (item) =>
              item.userId === where.userId_productId.userId &&
              item.productId === where.userId_productId.productId,
          ) ?? null
        );
      }),
      findMany: jest.fn(async ({ where, include }) => {
        const items = state.cartItems.filter(
          (item) => item.userId === where.userId,
        );

        return include?.product ? items.map(withProduct) : items;
      }),
      create: jest.fn(async ({ data, include }) => {
        const item = {
          id: nextId('cart-item'),
          userId: data.userId,
          productId: data.productId,
          quantity: data.quantity,
          createdAt: now(),
          updatedAt: now(),
        };

        state.cartItems.push(item);

        return include?.product ? withProduct(item) : item;
      }),
      deleteMany: jest.fn(async ({ where }) => {
        const beforeCount = state.cartItems.length;
        state.cartItems = state.cartItems.filter(
          (item) => item.userId !== where.userId,
        );

        return { count: beforeCount - state.cartItems.length };
      }),
    },
    order: {
      create: jest.fn(async ({ data }) => {
        const order = {
          id: nextId('order'),
          userId: data.userId,
          status: data.status,
          totalAmount: data.totalAmount,
          createdAt: now(),
          updatedAt: now(),
        };

        state.orders.push(order);

        return order;
      }),
      findMany: jest.fn(async ({ where, skip = 0, take = 10 }) => {
        return state.orders
          .filter((order) => order.userId === where.userId)
          .slice(skip, skip + take)
          .map((order) => withOrderItems(order));
      }),
      count: jest.fn(async ({ where }) => {
        return state.orders.filter((order) => order.userId === where.userId)
          .length;
      }),
      findFirst: jest.fn(async ({ where, include }) => {
        const order = state.orders.find(
          (stored) => stored.id === where.id && stored.userId === where.userId,
        );

        if (!order) {
          return null;
        }

        return include?.items ? withOrderItems(order, true) : order;
      }),
      findUnique: jest.fn(async ({ where, include }) => {
        const order = state.orders.find((stored) => stored.id === where.id);

        if (!order) {
          return null;
        }

        return include?.items ? withOrderItems(order, true) : order;
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        const order = state.orders.find(
          (stored) =>
            stored.id === where.id &&
            stored.userId === where.userId &&
            stored.status === where.status,
        );

        if (!order) {
          return { count: 0 };
        }

        order.status = data.status;
        order.updatedAt = now();

        return { count: 1 };
      }),
    },
    orderItem: {
      createMany: jest.fn(async ({ data }) => {
        data.forEach((item: any) => {
          state.orderItems.push({
            id: nextId('order-item'),
            ...item,
          });
        });

        return { count: data.length };
      }),
    },
  };

  return prisma;
}

describe('Order checkout flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: ReturnType<typeof createInMemoryPrisma>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1d';

    prisma = createInMemoryPrisma();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, logs in, checks out cart, reads order, and cancels it', async () => {
    const productId = prisma.state.products[0].id;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'flow@example.com',
        password: 'password123',
        name: 'Flow User',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.email).toBe('flow@example.com');
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'flow@example.com',
        password: 'password123',
      })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    expect(accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        productId,
        quantity: 2,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.data.productId).toBe(productId);
        expect(body.data.quantity).toBe(2);
      });

    const checkoutResponse = await request(app.getHttpServer())
      .post('/orders/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const order = checkoutResponse.body.data;
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.totalAmount).toBe(200);
    expect(order.items).toHaveLength(1);
    expect(prisma.state.products[0].stock).toBe(8);
    expect(prisma.state.cartItems).toHaveLength(0);

    await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.data).toHaveLength(1);
        expect(body.data.data[0].id).toBe(order.id);
      });

    await request(app.getHttpServer())
      .get(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.id).toBe(order.id);
        expect(body.data.items[0].product.id).toBe(productId);
      });

    await request(app.getHttpServer())
      .patch(`/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.id).toBe(order.id);
        expect(body.data.status).toBe(OrderStatus.CANCELLED);
      });

    expect(prisma.state.products[0].stock).toBe(10);
  });
});
