/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HookStatesService } from './hook-states.service';
import { HookState } from './entities/hook-state.entity';

describe('HookStatesService', () => {
  let service: HookStatesService;
  let mockRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const mockHookState = {
    area_id: 1,
    state_key: 'last_message_id',
    state_value: '12345',
    last_checked_at: new Date('2024-01-01T12:00:00Z'),
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 5 }),
    };

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HookStatesService,
        {
          provide: getRepositoryToken(HookState),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HookStatesService>(HookStatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new hook state', async () => {
      const createDto = {
        area_id: 1,
        state_key: 'last_message_id',
        state_value: '12345',
        last_checked_at: new Date(),
      };

      mockRepository.create.mockReturnValue(mockHookState);
      mockRepository.save.mockResolvedValue(mockHookState);

      const result = await service.create(createDto);

      expect(result).toEqual({
        area_id: 1,
        state_key: 'last_message_id',
        state_value: '12345',
        last_checked_at: mockHookState.last_checked_at,
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all hook states', async () => {
      mockRepository.find.mockResolvedValue([mockHookState]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].area_id).toBe(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { area_id: 'ASC', state_key: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a specific hook state', async () => {
      mockRepository.findOne.mockResolvedValue(mockHookState);

      const result = await service.findOne(1, 'last_message_id');

      expect(result.area_id).toBe(1);
      expect(result.state_key).toBe('last_message_id');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { area_id: 1, state_key: 'last_message_id' },
      });
    });

    it('should throw NotFoundException when hook state not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 'missing_key')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(1, 'missing_key')).rejects.toThrow(
        'HookState with area_id 1 and state_key missing_key not found',
      );
    });
  });

  describe('findByArea', () => {
    it('should return all hook states for an area', async () => {
      mockRepository.find.mockResolvedValue([mockHookState]);

      const result = await service.findByArea(1);

      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { area_id: 1 },
        order: { state_key: 'ASC' },
      });
    });
  });

  describe('findByStateKey', () => {
    it('should return all hook states with a specific key', async () => {
      mockRepository.find.mockResolvedValue([mockHookState]);

      const result = await service.findByStateKey('last_message_id');

      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { state_key: 'last_message_id' },
        order: { area_id: 'ASC' },
      });
    });
  });

  describe('findRecentlyChecked', () => {
    it('should return hook states checked within specified minutes', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([mockHookState]);

      const result = await service.findRecentlyChecked(60);

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'hook_state.last_checked_at',
        'DESC',
      );
    });

    it('should use default 60 minutes when not specified', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findRecentlyChecked();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findNeverChecked', () => {
    it('should return hook states never checked', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([mockHookState]);

      const result = await service.findNeverChecked();

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'hook_state.last_checked_at IS NULL',
      );
    });
  });

  describe('update', () => {
    it('should update a hook state', async () => {
      const updateDto = { state_value: 'new_value' };
      const updatedState = { ...mockHookState, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockHookState);
      mockRepository.save.mockResolvedValue(updatedState);

      const result = await service.update(1, 'last_message_id', updateDto);

      expect(result.state_value).toBe('new_value');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when hook state not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, 'missing_key', { state_value: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStateValue', () => {
    it('should update only the state value', async () => {
      const updatedState = { ...mockHookState, state_value: 'new_value' };

      mockRepository.findOne.mockResolvedValue(mockHookState);
      mockRepository.save.mockResolvedValue(updatedState);

      const result = await service.updateStateValue(
        1,
        'last_message_id',
        'new_value',
      );

      expect(result.state_value).toBe('new_value');
    });
  });

  describe('updateLastChecked', () => {
    it('should update last_checked_at with provided date', async () => {
      const checkDate = new Date('2024-01-02T10:00:00Z');
      const updatedState = { ...mockHookState, last_checked_at: checkDate };

      mockRepository.findOne.mockResolvedValue(mockHookState);
      mockRepository.save.mockResolvedValue(updatedState);

      const result = await service.updateLastChecked(
        1,
        'last_message_id',
        checkDate,
      );

      expect(result.last_checked_at).toEqual(checkDate);
    });

    it('should update last_checked_at with current date when not provided', async () => {
      mockRepository.findOne.mockResolvedValue(mockHookState);
      mockRepository.save.mockResolvedValue(mockHookState);

      await service.updateLastChecked(1, 'last_message_id');

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('upsert', () => {
    it('should create new hook state if not exists', async () => {
      const createDto = {
        area_id: 1,
        state_key: 'new_key',
        state_value: 'value',
        last_checked_at: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createDto);
      mockRepository.save.mockResolvedValue(createDto);

      const result = await service.upsert(createDto);

      expect(result.state_key).toBe('new_key');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should update existing hook state', async () => {
      const createDto = {
        area_id: 1,
        state_key: 'last_message_id',
        state_value: 'updated_value',
        last_checked_at: new Date(),
      };

      const updatedState = { ...mockHookState, state_value: 'updated_value' };

      mockRepository.findOne.mockResolvedValue(mockHookState);
      mockRepository.save.mockResolvedValue(updatedState);

      const result = await service.upsert(createDto);

      expect(result.state_value).toBe('updated_value');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a hook state', async () => {
      mockRepository.findOne.mockResolvedValue(mockHookState);
      mockRepository.remove.mockResolvedValue(mockHookState);

      await service.remove(1, 'last_message_id');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockHookState);
    });

    it('should throw NotFoundException when hook state not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 'missing_key')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeByArea', () => {
    it('should remove all hook states for an area', async () => {
      mockRepository.find.mockResolvedValue([mockHookState]);
      mockRepository.remove.mockResolvedValue([mockHookState]);

      await service.removeByArea(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { area_id: 1 },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith([mockHookState]);
    });

    it('should not throw when no hook states found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(service.removeByArea(1)).resolves.not.toThrow();
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove old hook states', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.execute.mockResolvedValue({ affected: 5 });

      const result = await service.cleanup(30);

      expect(result).toBe(5);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should return 0 when no hook states affected', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.execute.mockResolvedValue({ affected: undefined });

      const result = await service.cleanup(30);

      expect(result).toBe(0);
    });

    it('should use default 30 days when not specified', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      await service.cleanup();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return state value', async () => {
      const freshMockState = {
        area_id: 1,
        state_key: 'last_message_id',
        state_value: '12345',
        last_checked_at: new Date('2024-01-01T12:00:00Z'),
      };
      mockRepository.findOne.mockResolvedValue(freshMockState);

      const result = await service.getState(1, 'last_message_id');

      expect(result).toBe('12345');
    });

    it('should return null when hook state not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getState(1, 'missing_key');

      expect(result).toBeNull();
    });
  });

  describe('setState', () => {
    it('should update existing state', async () => {
      mockRepository.findOne.mockResolvedValue(mockHookState);
      mockRepository.save.mockResolvedValue(mockHookState);

      await service.setState(1, 'last_message_id', 'new_value');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create new state if not exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockHookState);
      mockRepository.save.mockResolvedValue(mockHookState);

      await service.setState(1, 'new_key', 'value');

      expect(mockRepository.create).toHaveBeenCalledWith({
        area_id: 1,
        state_key: 'new_key',
        state_value: 'value',
        last_checked_at: expect.any(Date),
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should set last_checked_at when provided', async () => {
      const checkDate = new Date('2024-01-02');
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockHookState);
      mockRepository.save.mockResolvedValue(mockHookState);

      await service.setState(1, 'new_key', 'value', checkDate);

      expect(mockRepository.create).toHaveBeenCalledWith({
        area_id: 1,
        state_key: 'new_key',
        state_value: 'value',
        last_checked_at: checkDate,
      });
    });
  });
});
