import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ComponentsService } from './components.service';
import { Component, ComponentType } from './entities/component.entity';
import { CreateComponentDto } from './dto/create-component.dto';
import { UpdateComponentDto } from './dto/update-component.dto';
import { Service } from '../services/entities/service.entity';

describe('ComponentsService', () => {
  let service: ComponentsService;
  let _repository: Repository<Component>;

  const mockService: Service = {
    id: 1,
    name: 'Discord',
    description: 'Discord service',
    icon_path: 'discord.svg',
    requires_auth: true,
    is_active: true,
  };

  const mockComponent: Component = {
    id: 1,
    service_id: 1,
    type: ComponentType.ACTION,
    name: 'message_posted',
    description: 'Triggered when a message is posted',
    is_active: true,
    webhook_endpoint: '/discord/message',
    polling_interval: null,
    service: mockService,
  };

  const mockReactionComponent: Component = {
    id: 2,
    service_id: 1,
    type: ComponentType.REACTION,
    name: 'send_message',
    description: 'Send a message',
    is_active: true,
    webhook_endpoint: null,
    polling_interval: null,
    service: mockService,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComponentsService,
        {
          provide: getRepositoryToken(Component),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ComponentsService>(ComponentsService);
    _repository = module.get<Repository<Component>>(
      getRepositoryToken(Component),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createComponentDto: CreateComponentDto = {
      service_id: 1,
      type: ComponentType.ACTION,
      name: 'new_action',
      description: 'A new action',
      is_active: true,
      webhook_endpoint: '/webhook/new',
      polling_interval: undefined,
    };

    it('should create a new component', async () => {
      mockRepository.create.mockReturnValue(mockComponent);
      mockRepository.save.mockResolvedValue(mockComponent);

      const result = await service.create(createComponentDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createComponentDto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockComponent.id,
        service_id: mockComponent.service_id,
        kind: mockComponent.type,
        name: mockComponent.name,
        description: mockComponent.description,
        is_active: mockComponent.is_active,
        webhook_endpoint: mockComponent.webhook_endpoint,
        polling_interval: mockComponent.polling_interval,
      });
    });

    it('should create a component with polling interval', async () => {
      const pollingComponent = {
        ...mockComponent,
        webhook_endpoint: null,
        polling_interval: 60,
      };

      mockRepository.create.mockReturnValue(pollingComponent);
      mockRepository.save.mockResolvedValue(pollingComponent);

      const result = await service.create({
        ...createComponentDto,
        webhook_endpoint: undefined,
        polling_interval: 60,
      });

      expect(result.polling_interval).toBe(60);
      expect(result.webhook_endpoint).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an array of components', async () => {
      mockRepository.find.mockResolvedValue([
        mockComponent,
        mockReactionComponent,
      ]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['service'],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: mockComponent.id,
        kind: ComponentType.ACTION,
      });
      expect(result[1]).toMatchObject({
        id: mockReactionComponent.id,
        kind: ComponentType.REACTION,
      });
    });

    it('should return an empty array when no components exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a component by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockComponent);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['service'],
      });
      expect(result).toMatchObject({
        id: mockComponent.id,
        name: mockComponent.name,
        kind: mockComponent.type,
      });
    });

    it('should throw NotFoundException when component does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Component with ID 999 not found',
      );
    });
  });

  describe('findByService', () => {
    it('should return components for a specific service', async () => {
      mockRepository.find.mockResolvedValue([
        mockComponent,
        mockReactionComponent,
      ]);

      const result = await service.findByService(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { service_id: 1 },
        relations: ['service'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].service_id).toBe(1);
      expect(result[1].service_id).toBe(1);
    });

    it('should return empty array when service has no components', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByService(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByType', () => {
    it('should return all action components', async () => {
      mockRepository.find.mockResolvedValue([mockComponent]);

      const result = await service.findByType(ComponentType.ACTION);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { type: ComponentType.ACTION },
        relations: ['service'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(ComponentType.ACTION);
    });

    it('should return all reaction components', async () => {
      mockRepository.find.mockResolvedValue([mockReactionComponent]);

      const result = await service.findByType(ComponentType.REACTION);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { type: ComponentType.REACTION },
        relations: ['service'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(ComponentType.REACTION);
    });
  });

  describe('findByServiceAndType', () => {
    it('should return components filtered by service and type', async () => {
      mockRepository.find.mockResolvedValue([mockComponent]);

      const result = await service.findByServiceAndType(
        1,
        ComponentType.ACTION,
      );

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { service_id: 1, type: ComponentType.ACTION },
        relations: ['service'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].service_id).toBe(1);
      expect(result[0].kind).toBe(ComponentType.ACTION);
    });

    it('should return empty array when no matching components', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByServiceAndType(
        999,
        ComponentType.ACTION,
      );

      expect(result).toEqual([]);
    });
  });

  describe('findActive', () => {
    it('should return only active components', async () => {
      const activeComponents = [mockComponent, mockReactionComponent];
      mockRepository.find.mockResolvedValue(activeComponents);

      const result = await service.findActive();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        relations: ['service'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.is_active)).toBe(true);
    });

    it('should return empty array when no active components', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('findActions', () => {
    it('should return all action components', async () => {
      mockRepository.find.mockResolvedValue([mockComponent]);

      const result = await service.findActions();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { type: ComponentType.ACTION },
        relations: ['service'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(ComponentType.ACTION);
    });
  });

  describe('findReactions', () => {
    it('should return all reaction components', async () => {
      mockRepository.find.mockResolvedValue([mockReactionComponent]);

      const result = await service.findReactions();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { type: ComponentType.REACTION },
        relations: ['service'],
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(ComponentType.REACTION);
    });
  });

  describe('update', () => {
    const updateComponentDto: UpdateComponentDto = {
      name: 'updated_name',
      description: 'Updated description',
      is_active: false,
    };

    it('should update a component', async () => {
      const updatedComponent = {
        ...mockComponent,
        ...updateComponentDto,
      };

      mockRepository.findOne.mockResolvedValue(mockComponent);
      mockRepository.save.mockResolvedValue(updatedComponent);

      const result = await service.update(1, updateComponentDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['service'],
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateComponentDto.name);
      expect(result.description).toBe(updateComponentDto.description);
      expect(result.is_active).toBe(updateComponentDto.is_active);
    });

    it('should throw NotFoundException when component does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateComponentDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, updateComponentDto)).rejects.toThrow(
        'Component with ID 999 not found',
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const partialUpdate: UpdateComponentDto = {
        is_active: false,
      };

      const updatedComponent = {
        ...mockComponent,
        is_active: false,
      };

      mockRepository.findOne.mockResolvedValue(mockComponent);
      mockRepository.save.mockResolvedValue(updatedComponent);

      const result = await service.update(1, partialUpdate);

      expect(result.is_active).toBe(false);
      expect(result.name).toBe(mockComponent.name);
      expect(result.description).toBe(mockComponent.description);
    });

    it('should update webhook_endpoint', async () => {
      const updateDto: UpdateComponentDto = {
        webhook_endpoint: '/new/webhook/path',
      };

      const updatedComponent = {
        ...mockComponent,
        webhook_endpoint: '/new/webhook/path',
      };

      mockRepository.findOne.mockResolvedValue(mockComponent);
      mockRepository.save.mockResolvedValue(updatedComponent);

      const result = await service.update(1, updateDto);

      expect(result.webhook_endpoint).toBe('/new/webhook/path');
    });

    it('should update polling_interval', async () => {
      const updateDto: UpdateComponentDto = {
        polling_interval: 120,
      };

      const updatedComponent = {
        ...mockComponent,
        polling_interval: 120,
      };

      mockRepository.findOne.mockResolvedValue(mockComponent);
      mockRepository.save.mockResolvedValue(updatedComponent);

      const result = await service.update(1, updateDto);

      expect(result.polling_interval).toBe(120);
    });
  });

  describe('remove', () => {
    it('should remove a component', async () => {
      mockRepository.findOne.mockResolvedValue(mockComponent);
      mockRepository.remove.mockResolvedValue(mockComponent);

      await service.remove(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockComponent);
    });

    it('should throw NotFoundException when component does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow(
        'Component with ID 999 not found',
      );
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('toResponseDto', () => {
    it('should correctly map component type to kind', async () => {
      mockRepository.findOne.mockResolvedValue(mockComponent);

      const result = await service.findOne(1);

      expect(result.kind).toBe(ComponentType.ACTION);
      expect(result).not.toHaveProperty('type');
    });

    it('should include all necessary fields in response', async () => {
      mockRepository.findOne.mockResolvedValue(mockComponent);

      const result = await service.findOne(1);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('service_id');
      expect(result).toHaveProperty('kind');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('is_active');
      expect(result).toHaveProperty('webhook_endpoint');
      expect(result).toHaveProperty('polling_interval');
    });

    it('should handle null values correctly', async () => {
      const componentWithNulls: Component = {
        ...mockComponent,
        description: null,
        webhook_endpoint: null,
        polling_interval: null,
      };

      mockRepository.findOne.mockResolvedValue(componentWithNulls);

      const result = await service.findOne(1);

      expect(result.description).toBeNull();
      expect(result.webhook_endpoint).toBeNull();
      expect(result.polling_interval).toBeNull();
    });
  });
});
