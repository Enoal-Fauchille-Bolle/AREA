import { Test, TestingModule } from '@nestjs/testing';
import { HookStatesController } from './hook-states.controller';
import { HookStatesService } from './hook-states.service';
import {
  CreateHookStateDto,
  UpdateHookStateDto,
  HookStateResponseDto,
} from './dto';

describe('HookStatesController', () => {
  let controller: HookStatesController;
  let _service: HookStatesService;

  const mockHookState: HookStateResponseDto = {
    area_id: 1,
    state_key: 'test_state',
    state_value: 'test_value',
    last_checked_at: new Date('2024-01-01'),
  };

  const mockHookStatesService = {
    create: jest.fn(),
    upsert: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStateValue: jest.fn(),
    updateLastChecked: jest.fn(),
    remove: jest.fn(),
    findByArea: jest.fn(),
    findByStateKey: jest.fn(),
    findRecentlyChecked: jest.fn(),
    findNeverChecked: jest.fn(),
    removeByArea: jest.fn(),
    cleanup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HookStatesController],
      providers: [
        {
          provide: HookStatesService,
          useValue: mockHookStatesService,
        },
      ],
    }).compile();

    controller = module.get<HookStatesController>(HookStatesController);
    _service = module.get<HookStatesService>(HookStatesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a hook state', async () => {
      const createDto: CreateHookStateDto = {
        area_id: 1,
        state_key: 'test_state',
        state_value: 'test_value',
      };

      mockHookStatesService.create.mockResolvedValue(mockHookState);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockHookState);
      expect(mockHookStatesService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('upsert', () => {
    it('should upsert a hook state', async () => {
      const createDto: CreateHookStateDto = {
        area_id: 1,
        state_key: 'test_state',
        state_value: 'updated_value',
      };

      const upsertedState = {
        ...mockHookState,
        state_value: 'updated_value',
      };

      mockHookStatesService.upsert.mockResolvedValue(upsertedState);

      const result = await controller.upsert(createDto);

      expect(result).toEqual(upsertedState);
      expect(mockHookStatesService.upsert).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all hook states without filters', async () => {
      mockHookStatesService.findAll.mockResolvedValue([mockHookState]);

      const result = await controller.findAll();

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findAll).toHaveBeenCalled();
    });

    it('should filter by area_id', async () => {
      mockHookStatesService.findByArea.mockResolvedValue([mockHookState]);

      const result = await controller.findAll('1');

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findByArea).toHaveBeenCalledWith(1);
    });

    it('should filter by state_key', async () => {
      mockHookStatesService.findByStateKey.mockResolvedValue([mockHookState]);

      const result = await controller.findAll(undefined, 'test_state');

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findByStateKey).toHaveBeenCalledWith(
        'test_state',
      );
    });

    it('should filter recently checked with recent_minutes', async () => {
      mockHookStatesService.findRecentlyChecked.mockResolvedValue([
        mockHookState,
      ]);

      const result = await controller.findAll(undefined, undefined, '30');

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findRecentlyChecked).toHaveBeenCalledWith(
        30,
      );
    });

    it('should filter never checked when never_checked=true', async () => {
      mockHookStatesService.findNeverChecked.mockResolvedValue([mockHookState]);

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        'true',
      );

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findNeverChecked).toHaveBeenCalled();
    });
  });

  describe('findByArea', () => {
    it('should return hook states for an area', async () => {
      mockHookStatesService.findByArea.mockResolvedValue([mockHookState]);

      const result = await controller.findByArea(1);

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findByArea).toHaveBeenCalledWith(1);
    });
  });

  describe('findByStateKey', () => {
    it('should return hook states by state key', async () => {
      mockHookStatesService.findByStateKey.mockResolvedValue([mockHookState]);

      const result = await controller.findByStateKey('test_state');

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findByStateKey).toHaveBeenCalledWith(
        'test_state',
      );
    });
  });

  describe('findRecentlyChecked', () => {
    it('should return recently checked states with default minutes', async () => {
      mockHookStatesService.findRecentlyChecked.mockResolvedValue([
        mockHookState,
      ]);

      const result = await controller.findRecentlyChecked();

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findRecentlyChecked).toHaveBeenCalledWith(
        60,
      );
    });

    it('should return recently checked states with custom minutes', async () => {
      mockHookStatesService.findRecentlyChecked.mockResolvedValue([
        mockHookState,
      ]);

      const result = await controller.findRecentlyChecked('120');

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findRecentlyChecked).toHaveBeenCalledWith(
        120,
      );
    });
  });

  describe('findNeverChecked', () => {
    it('should return never checked states', async () => {
      mockHookStatesService.findNeverChecked.mockResolvedValue([mockHookState]);

      const result = await controller.findNeverChecked();

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findNeverChecked).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a hook state by area and state key', async () => {
      mockHookStatesService.findOne.mockResolvedValue(mockHookState);

      const result = await controller.findOne(1, 'test_state');

      expect(result).toEqual(mockHookState);
      expect(mockHookStatesService.findOne).toHaveBeenCalledWith(
        1,
        'test_state',
      );
    });
  });

  describe('update', () => {
    it('should update a hook state', async () => {
      const updateDto: UpdateHookStateDto = {
        state_value: 'updated_value',
      };

      const updatedState = {
        ...mockHookState,
        state_value: 'updated_value',
      };

      mockHookStatesService.update.mockResolvedValue(updatedState);

      const result = await controller.update(1, 'test_state', updateDto);

      expect(result).toEqual(updatedState);
      expect(mockHookStatesService.update).toHaveBeenCalledWith(
        1,
        'test_state',
        updateDto,
      );
    });
  });

  describe('updateStateValue', () => {
    it('should update hook state value directly', async () => {
      const updatedState = {
        ...mockHookState,
        state_value: 'new_value',
      };

      mockHookStatesService.updateStateValue.mockResolvedValue(updatedState);

      const result = await controller.updateStateValue(1, 'test_state', {
        state_value: 'new_value',
      });

      expect(result).toEqual(updatedState);
      expect(mockHookStatesService.updateStateValue).toHaveBeenCalledWith(
        1,
        'test_state',
        'new_value',
      );
    });
  });

  describe('updateLastChecked', () => {
    it('should update last checked with current date when no date provided', async () => {
      const now = new Date();
      const updatedState = {
        ...mockHookState,
        last_checked_at: now,
      };

      mockHookStatesService.updateLastChecked.mockResolvedValue(updatedState);

      const result = await controller.updateLastChecked(1, 'test_state');

      expect(result).toEqual(updatedState);
      expect(mockHookStatesService.updateLastChecked).toHaveBeenCalledWith(
        1,
        'test_state',
        expect.any(Date),
      );
    });

    it('should update last checked with provided date', async () => {
      const specificDate = new Date('2024-02-01T10:00:00Z');
      const updatedState = {
        ...mockHookState,
        last_checked_at: specificDate,
      };

      mockHookStatesService.updateLastChecked.mockResolvedValue(updatedState);

      const result = await controller.updateLastChecked(1, 'test_state', {
        last_checked_at: '2024-02-01T10:00:00Z',
      });

      expect(result).toEqual(updatedState);
      expect(mockHookStatesService.updateLastChecked).toHaveBeenCalledWith(
        1,
        'test_state',
        specificDate,
      );
    });
  });

  describe('remove', () => {
    it('should remove a hook state', async () => {
      mockHookStatesService.remove.mockResolvedValue(undefined);

      await controller.remove(1, 'test_state');

      expect(mockHookStatesService.remove).toHaveBeenCalledWith(
        1,
        'test_state',
      );
    });
  });

  describe('removeByArea', () => {
    it('should remove all hook states for an area', async () => {
      mockHookStatesService.removeByArea.mockResolvedValue(undefined);

      await controller.removeByArea(1);

      expect(mockHookStatesService.removeByArea).toHaveBeenCalledWith(1);
    });
  });

  describe('cleanup', () => {
    it('should cleanup old hook states with default days', async () => {
      mockHookStatesService.cleanup.mockResolvedValue(42);

      const result = await controller.cleanup();

      expect(result).toEqual({ deleted: 42 });
      expect(mockHookStatesService.cleanup).toHaveBeenCalledWith(30);
    });

    it('should cleanup old hook states with custom days', async () => {
      mockHookStatesService.cleanup.mockResolvedValue(15);

      const result = await controller.cleanup('60');

      expect(result).toEqual({ deleted: 15 });
      expect(mockHookStatesService.cleanup).toHaveBeenCalledWith(60);
    });

    it('should handle cleanup with zero results', async () => {
      mockHookStatesService.cleanup.mockResolvedValue(0);

      const result = await controller.cleanup('90');

      expect(result).toEqual({ deleted: 0 });
      expect(mockHookStatesService.cleanup).toHaveBeenCalledWith(90);
    });
  });

  describe('edge cases', () => {
    it('should handle invalid area_id in query', async () => {
      mockHookStatesService.findByArea.mockResolvedValue([]);

      await controller.findAll('invalid');

      expect(mockHookStatesService.findByArea).toHaveBeenCalledWith(NaN);
    });

    it('should prioritize never_checked filter', async () => {
      mockHookStatesService.findNeverChecked.mockResolvedValue([mockHookState]);

      const result = await controller.findAll('1', 'key', '30', 'true');

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findNeverChecked).toHaveBeenCalled();
      expect(mockHookStatesService.findByArea).not.toHaveBeenCalled();
    });

    it('should prioritize recent_minutes over area filter', async () => {
      mockHookStatesService.findRecentlyChecked.mockResolvedValue([
        mockHookState,
      ]);

      const result = await controller.findAll('1', undefined, '30');

      expect(result).toEqual([mockHookState]);
      expect(mockHookStatesService.findRecentlyChecked).toHaveBeenCalled();
      expect(mockHookStatesService.findByArea).not.toHaveBeenCalled();
    });
  });
});
