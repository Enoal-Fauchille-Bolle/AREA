import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import type { Request } from 'express';

describe('AppController', () => {
  let controller: AppController;
  let mockAppService: {
    getAbout: jest.Mock;
  };

  beforeEach(async () => {
    mockAppService = {
      getAbout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAbout', () => {
    it('should return about information', async () => {
      const mockRequest = {
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
      } as unknown as Request;

      const mockAboutData = {
        client: { host: 'localhost:3000' },
        server: {
          current_time: 1234567890,
          services: [],
        },
      };

      mockAppService.getAbout.mockResolvedValue(mockAboutData);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await controller.getAbout(mockRequest);

      expect(result).toEqual(mockAboutData);
      expect(mockAppService.getAbout).toHaveBeenCalledWith(mockRequest);
    });

    it('should pass the request object to service', async () => {
      const mockRequest = {
        protocol: 'https',
        get: jest.fn().mockReturnValue('example.com'),
        headers: { 'user-agent': 'test-agent' },
      } as unknown as Request;

      mockAppService.getAbout.mockResolvedValue({});

      await controller.getAbout(mockRequest);

      expect(mockAppService.getAbout).toHaveBeenCalledWith(mockRequest);
      expect(mockAppService.getAbout).toHaveBeenCalledTimes(1);
    });
  });
});
