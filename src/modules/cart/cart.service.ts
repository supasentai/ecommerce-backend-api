import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
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

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    return {
      items,
      summary: {
        totalItems,
        totalAmount,
      },
    };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not active');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException('Not enough stock');
    }

    const existingCartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
    });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + dto.quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException('Not enough stock');
      }

      return this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: newQuantity,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });
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
