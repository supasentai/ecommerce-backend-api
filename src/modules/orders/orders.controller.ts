import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Get('admin/all')
  @Roles(Role.ADMIN)
  findAllOrders(@Query() query: FindOrdersQueryDto) {
    return this.ordersService.findAllOrders(query);
  }

  @Get('admin/:id')
  @Roles(Role.ADMIN)
  findOrderByAdmin(@Param('id') id: string) {
    return this.ordersService.findOrderByAdmin(id);
  }

  @Patch('admin/:id/status')
  @Roles(Role.ADMIN)
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto);
  }
  @Get(':id')
  findMyOrder(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.findMyOrder(request.user.id, id);
  }
}
