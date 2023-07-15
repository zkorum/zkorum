import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppService } from '../app.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              return 'test';
            }),
          },
        },
        // {
        //   provide: PrismaService,
        //   useValue: {
        //     'email.findFirst': jest.fn().mockReturnValueOnce(false),
        //   },
        // },
      ],
    }).compile();

    authController = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);

    // used to mock database entries
    prisma = app.get<PrismaService>(PrismaService);
  });

  describe('root', () => {
    it('no email entry with valid email', () => {
      // mock email entry
      prisma.email.findFirst = jest.fn().mockReturnValueOnce(false);
      const dto = {
        email: 'n@gmail.com',
      };
      expect(authController.isEmailAvailable(dto)).toBe(true);
    });
    it('no email entry with invalid email', () => {
      // mock email entry
      prisma.email.findFirst = jest.fn().mockReturnValueOnce(false);
      const dto = {
        email: 'ngmail.com',
      };
      expect(authController.isEmailAvailable(dto)).toBe(false);
    });
    it('email entry with valid email', () => {
      // mock email entry
      prisma.email.findFirst = jest.fn().mockReturnValueOnce(true);
      const dto = {
        email: 'n@gmail.com',
      };
      expect(authController.isEmailAvailable(dto)).toBe(false);
    });
    it('email entry with invalid email', () => {
      // mock email entry
      prisma.email.findFirst = jest.fn().mockReturnValueOnce(true);
      const dto = {
        email: 'ngmail.com',
      };
      expect(authController.isEmailAvailable(dto)).toBe(false);
    });
  });
});
