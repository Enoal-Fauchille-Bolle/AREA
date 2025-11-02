/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { ServicesService } from './services/services.service';
import { ComponentsService } from './components/components.service';
import { VariablesService } from './variables/variables.service';
import { ComponentType } from './components/entities/component.entity';
import type { Request } from 'express';

describe('AppService', () => {
  let service: AppService;
  let mockServicesService: {
    findActive: jest.Mock;
  };
  let mockComponentsService: {
    findByService: jest.Mock;
  };
  let mockVariablesService: Record<string, jest.Mock>;

  const mockService1 = {
    id: 1,
    name: 'Discord',
    description: 'Discord service',
  };

  const mockService2 = {
    id: 2,
    name: 'GitHub',
    description: 'GitHub service',
  };

  const mockComponents = [
    {
      id: 1,
      name: 'new_message',
      description: 'New message received',
      kind: ComponentType.ACTION,
    },
    {
      id: 2,
      name: 'send_message',
      description: 'Send a message',
      kind: ComponentType.REACTION,
    },
  ];

  beforeEach(async () => {
    mockServicesService = {
      findActive: jest.fn(),
    };

    mockComponentsService = {
      findByService: jest.fn(),
    };

    mockVariablesService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
        {
          provide: ComponentsService,
          useValue: mockComponentsService,
        },
        {
          provide: VariablesService,
          useValue: mockVariablesService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAbout', () => {
    it('should return about information with services, actions, and reactions', async () => {
      const mockRequest = {
        ip: '192.168.1.1',
        headers: {},
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([
        mockService1,
        mockService2,
      ]);
      mockComponentsService.findByService.mockResolvedValueOnce(mockComponents);
      mockComponentsService.findByService.mockResolvedValueOnce([]);

      const result = await service.getAbout(mockRequest);

      expect(result).toHaveProperty('client');
      expect(result.client).toHaveProperty('host', '192.168.1.1');
      expect(result).toHaveProperty('server');
      expect(result.server).toHaveProperty('current_time');
      expect(result.server).toHaveProperty('services');
      expect(result.server.services).toHaveLength(2);
      expect(result.server.services[0]).toEqual({
        name: 'discord',
        actions: [
          {
            name: 'new_message',
            description: 'New message received',
          },
        ],
        reactions: [
          {
            name: 'send_message',
            description: 'Send a message',
          },
        ],
      });
      expect(mockServicesService.findActive).toHaveBeenCalled();
      expect(mockComponentsService.findByService).toHaveBeenCalledTimes(2);
    });

    it('should handle services with no components', async () => {
      const mockRequest = {
        ip: '10.0.0.1',
        headers: {},
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([mockService1]);
      mockComponentsService.findByService.mockResolvedValue([]);

      const result = await service.getAbout(mockRequest);

      expect(result.server.services).toHaveLength(1);
      expect(result.server.services[0]).toEqual({
        name: 'discord',
        actions: [],
        reactions: [],
      });
    });

    it('should extract IP from x-forwarded-for header', async () => {
      const mockRequest = {
        ip: undefined,
        headers: { 'x-forwarded-for': '203.0.113.5' },
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([]);

      const result = await service.getAbout(mockRequest);

      expect(result.client.host).toBe('203.0.113.5');
    });

    it('should extract IP from socket.remoteAddress', async () => {
      const mockRequest = {
        ip: undefined,
        headers: {},
        socket: { remoteAddress: '198.51.100.42' },
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([]);

      const result = await service.getAbout(mockRequest);

      expect(result.client.host).toBe('198.51.100.42');
    });

    it('should handle IPv4-mapped IPv6 addresses', async () => {
      const mockRequest = {
        ip: '::ffff:192.168.1.100',
        headers: {},
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([]);

      const result = await service.getAbout(mockRequest);

      expect(result.client.host).toBe('192.168.1.100');
    });

    it('should normalize IPv6 localhost to IPv4', async () => {
      const mockRequest = {
        ip: '::1',
        headers: {},
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([]);

      const result = await service.getAbout(mockRequest);

      expect(result.client.host).toBe('127.0.0.1');
    });

    it('should handle comma-separated IP list in x-forwarded-for', async () => {
      const mockRequest = {
        ip: undefined,
        headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.2, 192.0.2.3' },
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([]);

      const result = await service.getAbout(mockRequest);

      expect(result.client.host).toBe('203.0.113.1');
    });

    it('should handle array IP from x-forwarded-for', async () => {
      const mockRequest = {
        ip: undefined,
        headers: { 'x-forwarded-for': ['203.0.113.1', '198.51.100.2'] },
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([]);

      const result = await service.getAbout(mockRequest);

      expect(result.client.host).toBe('203.0.113.1');
    });

    it('should throw error when IP cannot be determined', async () => {
      const mockRequest = {
        ip: undefined,
        headers: {},
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([]);

      await expect(service.getAbout(mockRequest)).rejects.toThrow(
        'Unable to determine IP address',
      );
    });

    it('should throw error when IP is empty string', async () => {
      const mockRequest = {
        ip: '   ',
        headers: {},
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([]);

      await expect(service.getAbout(mockRequest)).rejects.toThrow(
        'Unable to determine IP address',
      );
    });

    it('should include current unix timestamp', async () => {
      const mockRequest = {
        ip: '192.168.1.1',
        headers: {},
        socket: {},
      } as unknown as Request;

      mockServicesService.findActive.mockResolvedValue([]);

      const beforeTimestamp = Math.floor(Date.now() / 1000);
      const result = await service.getAbout(mockRequest);
      const afterTimestamp = Math.floor(Date.now() / 1000);

      expect(result.server.current_time).toBeGreaterThanOrEqual(
        beforeTimestamp,
      );
      expect(result.server.current_time).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should convert service names to lowercase', async () => {
      const mockRequest = {
        ip: '192.168.1.1',
        headers: {},
        socket: {},
      } as unknown as Request;

      const mixedCaseService = {
        id: 1,
        name: 'GitHub',
        description: 'GitHub service',
      };

      mockServicesService.findActive.mockResolvedValue([mixedCaseService]);
      mockComponentsService.findByService.mockResolvedValue([]);

      const result = await service.getAbout(mockRequest);

      expect(result.server.services[0].name).toBe('github');
    });
  });
});
