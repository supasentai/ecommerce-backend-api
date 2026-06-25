import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
<<<<<<< HEAD
import { createHash } from 'crypto';
=======
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170

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
<<<<<<< HEAD
    mockPrismaService.user.findUnique.mockResolvedValue({
      ...mockUser,
      password: await bcrypt.hash('Password123!', 10),
    });
    mockPrismaService.user.update.mockResolvedValue({
      ...mockUser,
=======
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-refresh-hash' as never);
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaService.user.update.mockResolvedValue({
      ...mockUser,
      refreshTokenHash: 'new-refresh-hash',
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170
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
<<<<<<< HEAD
    const storedRefreshTokenHash =
      mockPrismaService.user.update.mock.calls[0][0].data.refreshTokenHash;
    await expect(
      bcrypt.compare(digestRefreshToken('refresh-token'), storedRefreshTokenHash),
    ).resolves.toBe(true);
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { refreshTokenHash: expect.any(String) },
=======
    expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', 10);
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { refreshTokenHash: 'new-refresh-hash' },
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170
    });
  });

  it('should rotate refresh token when refresh token is valid', async () => {
<<<<<<< HEAD
=======
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('rotated-hash' as never);
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      role: Role.USER,
<<<<<<< HEAD
      tokenType: 'refresh',
=======
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170
    });
    mockJwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');
<<<<<<< HEAD
    mockPrismaService.user.findUnique.mockResolvedValue({
      ...mockUser,
      refreshTokenHash: await bcrypt.hash(
        digestRefreshToken('old-refresh-token'),
        10,
      ),
    });
    mockPrismaService.user.update.mockResolvedValue({
      ...mockUser,
=======
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaService.user.update.mockResolvedValue({
      ...mockUser,
      refreshTokenHash: 'rotated-hash',
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170
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

<<<<<<< HEAD
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
=======
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'old-refresh-token',
      'hashed-refresh-token',
    );
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { refreshTokenHash: 'rotated-hash' },
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170
    });
  });

  it('should reject refresh when token hash does not match', async () => {
<<<<<<< HEAD
=======
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      role: Role.USER,
<<<<<<< HEAD
      tokenType: 'refresh',
    });
    mockPrismaService.user.findUnique.mockResolvedValue({
      ...mockUser,
      refreshTokenHash: await bcrypt.hash(
        digestRefreshToken('valid-refresh-token'),
        10,
      ),
    });
=======
    });
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170

    await expect(
      service.refresh({ refreshToken: 'invalid-refresh-token' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockPrismaService.user.update).not.toHaveBeenCalled();
  });

  it('should revoke refresh token on logout', async () => {
<<<<<<< HEAD
=======
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      role: Role.USER,
<<<<<<< HEAD
      tokenType: 'refresh',
    });
    mockPrismaService.user.findUnique.mockResolvedValue({
      ...mockUser,
      refreshTokenHash: await bcrypt.hash(
        digestRefreshToken('valid-refresh-token'),
        10,
      ),
    });
=======
    });
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
>>>>>>> fa563a20eb27a0e23718973766fc4daf0873f170
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
