import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Req() request: AuthenticatedRequest) {
    return this.ordersService.checkout(request.user.id);
  }

  @Get()
  findMyOrders(
    @Req() request: AuthenticatedRequest,
    @Query() query: FindOrdersQueryDto,
  ) {
    return this.ordersService.findMyOrders(request.user.id, query);
  }

  @Get(':id')
  findMyOrder(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.findMyOrder(request.user.id, id);
  }
}
