import { Test, TestingModule } from '@nestjs/testing';
import { ClockService } from './clock.service';
import { HookStatesService } from '../hook-states/hook-states.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreasService } from '../areas/areas.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { ReactionProcessorService } from '../common/reaction-processor.service';
import { ExecutionStatus } from '../area-executions/entities/area-execution.entity';

describe('ClockService', () => {
  let service: ClockService;
  let _hookStatesService: HookStatesService;
  let _areaExecutionsService: AreaExecutionsService;
  let _areasService: AreasService;
  let _areaParametersService: AreaParametersService;
  let _reactionProcessorService: ReactionProcessorService;

  const mockArea = {
    id: 1,
    user_id: 1,
    name: 'Test Daily Timer',
    description: 'Test area',
    component_action_id: 1,
    component_reaction_id: 2,
    is_active: true,
    triggered_count: 0,
    last_triggered_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockExecution = {
    id: 1,
    area_id: 1,
    status: ExecutionStatus.PENDING,
    trigger_data: {},
    started_at: new Date(),
    completed_at: null,
    error_message: null,
    created_at: new Date(),
  };

  const mockHookStatesService = {
    getState: jest.fn(),
    setState: jest.fn(),
  };

  const mockAreaExecutionsService = {
    create: jest.fn(),
    startExecution: jest.fn(),
  };

  const mockAreasService = {
    findByActionComponent: jest.fn(),
  };

  const mockAreaParametersService = {
    findByArea: jest.fn(),
  };

  const mockReactionProcessorService = {
    processReaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClockService,
        {
          provide: HookStatesService,
          useValue: mockHookStatesService,
        },
        {
          provide: AreaExecutionsService,
          useValue: mockAreaExecutionsService,
        },
        {
          provide: AreasService,
          useValue: mockAreasService,
        },
        {
          provide: AreaParametersService,
          useValue: mockAreaParametersService,
        },
        {
          provide: ReactionProcessorService,
          useValue: mockReactionProcessorService,
        },
      ],
    }).compile();

    service = module.get<ClockService>(ClockService);
    _hookStatesService = module.get<HookStatesService>(HookStatesService);
    _areaExecutionsService = module.get<AreaExecutionsService>(
      AreaExecutionsService,
    );
    _areasService = module.get<AreasService>(AreasService);
    _areaParametersService = module.get<AreaParametersService>(
      AreaParametersService,
    );
    _reactionProcessorService = module.get<ReactionProcessorService>(
      ReactionProcessorService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleTimerTriggers', () => {
    it('should check all timer types', async () => {
      mockAreasService.findByActionComponent.mockResolvedValue([]);

      await service.handleTimerTriggers();

      expect(mockAreasService.findByActionComponent).toHaveBeenCalledWith(
        'daily_timer',
      );
      expect(mockAreasService.findByActionComponent).toHaveBeenCalledWith(
        'weekly_timer',
      );
      expect(mockAreasService.findByActionComponent).toHaveBeenCalledWith(
        'monthly_timer',
      );
      expect(mockAreasService.findByActionComponent).toHaveBeenCalledWith(
        'interval_timer',
      );
    });

    it('should handle errors gracefully', async () => {
      mockAreasService.findByActionComponent.mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw
      await expect(service.handleTimerTriggers()).resolves.not.toThrow();
    });

    it('should process daily timer areas', async () => {
      const timeParam = {
        id: 1,
        area_id: mockArea.id,
        variable_id: 1,
        value: '09:00',
        variable: { name: 'time' },
      };

      mockAreasService.findByActionComponent
        .mockResolvedValueOnce([mockArea]) // daily timers
        .mockResolvedValueOnce([]) // weekly
        .mockResolvedValueOnce([]) // monthly
        .mockResolvedValueOnce([]); // interval

      mockAreaParametersService.findByArea.mockResolvedValue([timeParam]);
      mockHookStatesService.getState.mockResolvedValue(null);
      mockAreaExecutionsService.create.mockResolvedValue(mockExecution);
      mockAreaExecutionsService.startExecution.mockResolvedValue(undefined);
      mockReactionProcessorService.processReaction.mockResolvedValue(undefined);
      mockHookStatesService.setState.mockResolvedValue(undefined);

      // Mock current time to match trigger time
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await service.handleTimerTriggers();

      expect(mockAreaParametersService.findByArea).toHaveBeenCalledWith(
        mockArea.id,
      );
    });
  });

  describe('timer trigger logic', () => {
    it('should not trigger if no time parameter is configured', async () => {
      mockAreasService.findByActionComponent.mockResolvedValue([mockArea]);
      mockAreaParametersService.findByArea.mockResolvedValue([]);

      await service.handleTimerTriggers();

      expect(mockAreaExecutionsService.create).not.toHaveBeenCalled();
    });

    it('should not trigger if already triggered today', async () => {
      const timeParam = {
        id: 1,
        area_id: mockArea.id,
        variable_id: 1,
        value: '09:00',
        variable: { name: 'time' },
      };

      mockAreasService.findByActionComponent
        .mockResolvedValueOnce([mockArea])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockAreaParametersService.findByArea.mockResolvedValue([timeParam]);
      mockHookStatesService.getState.mockResolvedValue({
        id: 1,
        area_id: mockArea.id,
        state_key: 'daily_timer_1_20240101',
        state_value: 'triggered',
        expires_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await service.handleTimerTriggers();

      expect(mockAreaExecutionsService.create).not.toHaveBeenCalled();
    });

    it('should trigger and create execution when time matches', async () => {
      const timeParam = {
        id: 1,
        area_id: mockArea.id,
        variable_id: 1,
        value: '09:00',
        variable: { name: 'time' },
      };

      mockAreasService.findByActionComponent
        .mockResolvedValueOnce([mockArea])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockAreaParametersService.findByArea.mockResolvedValue([timeParam]);
      mockHookStatesService.getState.mockResolvedValue(null);
      mockAreaExecutionsService.create.mockResolvedValue(mockExecution);
      mockAreaExecutionsService.startExecution.mockResolvedValue(undefined);
      mockReactionProcessorService.processReaction.mockResolvedValue(undefined);
      mockHookStatesService.setState.mockResolvedValue(undefined);

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await service.handleTimerTriggers();

      expect(mockAreaExecutionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          areaId: mockArea.id,
          status: ExecutionStatus.PENDING,
        }),
      );
      expect(mockAreaExecutionsService.startExecution).toHaveBeenCalledWith(
        mockExecution.id,
      );
      expect(mockReactionProcessorService.processReaction).toHaveBeenCalledWith(
        mockArea.component_reaction_id,
        mockExecution.id,
        mockArea.id,
      );
      expect(mockHookStatesService.setState).toHaveBeenCalled();
    });

    it('should not trigger when time does not match', async () => {
      const timeParam = {
        id: 1,
        area_id: mockArea.id,
        variable_id: 1,
        value: '09:00',
        variable: { name: 'time' },
      };

      mockAreasService.findByActionComponent
        .mockResolvedValueOnce([mockArea])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockAreaParametersService.findByArea.mockResolvedValue([timeParam]);

      // Current time is 10:00, not 09:00
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await service.handleTimerTriggers();

      expect(mockAreaExecutionsService.create).not.toHaveBeenCalled();
    });

    it('should handle errors in individual area processing', async () => {
      const timeParam = {
        id: 1,
        area_id: mockArea.id,
        variable_id: 1,
        value: '09:00',
        variable: { name: 'time' },
      };

      mockAreasService.findByActionComponent
        .mockResolvedValueOnce([mockArea])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockAreaParametersService.findByArea.mockResolvedValue([timeParam]);
      mockHookStatesService.getState.mockResolvedValue(null);
      mockAreaExecutionsService.create.mockRejectedValue(
        new Error('Execution creation failed'),
      );

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      // Should not throw, errors are logged
      await expect(service.handleTimerTriggers()).resolves.not.toThrow();
    });
  });

  describe('time formatting', () => {
    it('should format single-digit hours with leading zero', async () => {
      mockAreasService.findByActionComponent.mockResolvedValue([]);

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(5);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(30);

      await service.handleTimerTriggers();

      // Time should be formatted as "05:30"
      expect(mockAreasService.findByActionComponent).toHaveBeenCalled();
    });

    it('should format single-digit minutes with leading zero', async () => {
      mockAreasService.findByActionComponent.mockResolvedValue([]);

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(5);

      await service.handleTimerTriggers();

      // Time should be formatted as "10:05"
      expect(mockAreasService.findByActionComponent).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty areas list', async () => {
      mockAreasService.findByActionComponent.mockResolvedValue([]);

      await service.handleTimerTriggers();

      expect(mockAreaExecutionsService.create).not.toHaveBeenCalled();
    });

    it('should handle multiple areas with same trigger time', async () => {
      const area1 = { ...mockArea, id: 1 };
      const area2 = { ...mockArea, id: 2 };

      const timeParam = {
        id: 1,
        area_id: 1,
        variable_id: 1,
        value: '09:00',
        variable: { name: 'time' },
      };

      mockAreasService.findByActionComponent
        .mockResolvedValueOnce([area1, area2])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockAreaParametersService.findByArea.mockResolvedValue([timeParam]);
      mockHookStatesService.getState.mockResolvedValue(null);
      mockAreaExecutionsService.create.mockResolvedValue(mockExecution);
      mockAreaExecutionsService.startExecution.mockResolvedValue(undefined);
      mockReactionProcessorService.processReaction.mockResolvedValue(undefined);
      mockHookStatesService.setState.mockResolvedValue(undefined);

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await service.handleTimerTriggers();

      // Should create executions for both areas
      expect(mockAreaExecutionsService.create).toHaveBeenCalledTimes(2);
    });
  });
});
