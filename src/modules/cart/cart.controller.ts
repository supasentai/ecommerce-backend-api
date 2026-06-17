import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findMyCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.findMyCart(request.user.id);
  }

  @Post('items')
  addItem(@Req() request: AuthenticatedRequest, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(request.user.id, dto);
  }

  @Patch('items/:id')
  updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(request.user.id, id, dto);
  }

  @Delete('items/:id')
  removeItem(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.cartService.removeItem(request.user.id, id);
  }

  @Delete()
  clearCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.clearCart(request.user.id);
  }
}
