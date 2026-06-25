import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.refresh', () => {
    const dto = { refreshToken: 'refresh-token' };
    const result = {
      accessToken: 'access-token',
      refreshToken: 'new-refresh-token',
    };

    mockAuthService.refresh.mockReturnValue(result);

    expect(controller.refresh(dto)).toEqual(result);
    expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
  });

  it('should call authService.logout', () => {
    const dto = { refreshToken: 'refresh-token' };
    const result = {
      message: 'Logged out successfully',
    };

    mockAuthService.logout.mockReturnValue(result);

    expect(controller.logout(dto)).toEqual(result);
    expect(mockAuthService.logout).toHaveBeenCalledWith(dto);
  });
});
