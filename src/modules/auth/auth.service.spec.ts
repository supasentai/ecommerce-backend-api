import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

const digestRefreshToken = (refreshToken: string) =>
  createHash('sha256').update(refreshToken).digest('hex');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockUser = {
    id: 'user-id',
    email: 'user@example.com',
    password: 'hashed-password',
    refreshTokenHash: 'hashed-refresh-token',
    name: 'Demo User',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return access and refresh tokens on login and store refresh token hash', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      ...mockUser,
      password: await bcrypt.hash('Password123!', 10),
    });
    mockPrismaService.user.update.mockResolvedValue({
      ...mockUser,
    });
    mockJwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'Password123!',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      },
    });

    expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    const storedRefreshTokenHash =
      mockPrismaService.user.update.mock.calls[0][0].data.refreshTokenHash;
    await expect(
      bcrypt.compare(digestRefreshToken('refresh-token'), storedRefreshTokenHash),
    ).resolves.toBe(true);
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { refreshTokenHash: expect.any(String) },
    });
  });

  it('should rotate refresh token when refresh token is valid', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      role: Role.USER,
      tokenType: 'refresh',
    });
    mockJwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');
    mockPrismaService.user.findUnique.mockResolvedValue({
      ...mockUser,
      refreshTokenHash: await bcrypt.hash(
        digestRefreshToken('old-refresh-token'),
        10,
      ),
    });
    mockPrismaService.user.update.mockResolvedValue({
      ...mockUser,
    });

    await expect(
      service.refresh({ refreshToken: 'old-refresh-token' }),
    ).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      },
    });

    const rotatedRefreshTokenHash =
      mockPrismaService.user.update.mock.calls[0][0].data.refreshTokenHash;
    await expect(
      bcrypt.compare(
        digestRefreshToken('new-refresh-token'),
        rotatedRefreshTokenHash,
      ),
    ).resolves.toBe(true);
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { refreshTokenHash: expect.any(String) },
    });
  });

  it('should reject refresh when token hash does not match', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      role: Role.USER,
      tokenType: 'refresh',
    });
    mockPrismaService.user.findUnique.mockResolvedValue({
      ...mockUser,
      refreshTokenHash: await bcrypt.hash(
        digestRefreshToken('valid-refresh-token'),
        10,
      ),
    });

    await expect(
      service.refresh({ refreshToken: 'invalid-refresh-token' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockPrismaService.user.update).not.toHaveBeenCalled();
  });

  it('should revoke refresh token on logout', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      role: Role.USER,
      tokenType: 'refresh',
    });
    mockPrismaService.user.findUnique.mockResolvedValue({
      ...mockUser,
      refreshTokenHash: await bcrypt.hash(
        digestRefreshToken('valid-refresh-token'),
        10,
      ),
    });
    mockPrismaService.user.update.mockResolvedValue({
      ...mockUser,
      refreshTokenHash: null,
    });

    await expect(
      service.logout({ refreshToken: 'valid-refresh-token' }),
    ).resolves.toEqual({
      message: 'Logged out successfully',
    });

    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { refreshTokenHash: null },
    });
  });
});
