import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WellKnownController } from './well-known.controller';

describe('WellKnownController', () => {
  let controller: WellKnownController;
  let mockConfigService: {
    get: jest.Mock;
  };

  const mockAndroidConfig = {
    packageName: 'com.example.app',
    sha256: 'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD',
  };

  const mockIosConfig = {
    teamId: 'ABCD1234',
    bundleId: 'com.example.app',
  };

  const mockOAuth2Config = {
    auth: { mobile_redirect_uri: '/auth/callback' },
    service: { mobile_redirect_uri: '/service/callback' },
  };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'app') {
          return {
            mobile: {
              android: mockAndroidConfig,
              ios: mockIosConfig,
            },
            oauth2: mockOAuth2Config,
          };
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WellKnownController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<WellKnownController>(WellKnownController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAssetLinks', () => {
    it('should return Android Digital Asset Links', () => {
      const result = controller.getAssetLinks();

      expect(result).toEqual([
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: mockAndroidConfig.packageName,
            sha256_cert_fingerprints: [mockAndroidConfig.sha256],
          },
        },
      ]);
    });

    it('should throw error when Android config is missing', () => {
      mockConfigService.get.mockReturnValue({
        mobile: {
          android: { packageName: undefined, sha256: undefined },
          ios: mockIosConfig,
        },
        oauth2: mockOAuth2Config,
      });

      // Recreate controller with invalid config
      const newController = new WellKnownController(
        mockConfigService as unknown as ConfigService,
      );

      expect(() => newController.getAssetLinks()).toThrow(
        'Android App Links configuration is missing. Please set ANDROID_PACKAGE_NAME and ANDROID_SHA256_FINGERPRINT',
      );
    });

    it('should throw error when Android package name is missing', () => {
      mockConfigService.get.mockReturnValue({
        mobile: {
          android: { packageName: undefined, sha256: mockAndroidConfig.sha256 },
          ios: mockIosConfig,
        },
        oauth2: mockOAuth2Config,
      });

      const newController = new WellKnownController(
        mockConfigService as unknown as ConfigService,
      );

      expect(() => newController.getAssetLinks()).toThrow(
        'Android App Links configuration is missing. Please set ANDROID_PACKAGE_NAME and ANDROID_SHA256_FINGERPRINT',
      );
    });
  });

  describe('getAppleAppSiteAssociation', () => {
    it('should return Apple App Site Association', () => {
      const result = controller.getAppleAppSiteAssociation();

      expect(result).toEqual({
        applinks: {
          apps: [],
          details: [
            {
              appID: `${mockIosConfig.teamId}.${mockIosConfig.bundleId}`,
              paths: [
                mockOAuth2Config.auth.mobile_redirect_uri,
                mockOAuth2Config.service.mobile_redirect_uri,
              ],
            },
          ],
        },
        webcredentials: {
          apps: [`${mockIosConfig.teamId}.${mockIosConfig.bundleId}`],
        },
      });
    });

    it('should throw error when iOS config is missing', () => {
      mockConfigService.get.mockReturnValue({
        mobile: {
          android: mockAndroidConfig,
          ios: { teamId: undefined, bundleId: undefined },
        },
        oauth2: mockOAuth2Config,
      });

      const newController = new WellKnownController(
        mockConfigService as unknown as ConfigService,
      );

      expect(() => newController.getAppleAppSiteAssociation()).toThrow(
        'iOS Universal Links configuration is missing',
      );
    });

    it('should throw error when iOS team ID is missing', () => {
      mockConfigService.get.mockReturnValue({
        mobile: {
          android: mockAndroidConfig,
          ios: { teamId: undefined, bundleId: mockIosConfig.bundleId },
        },
        oauth2: mockOAuth2Config,
      });

      const newController = new WellKnownController(
        mockConfigService as unknown as ConfigService,
      );

      expect(() => newController.getAppleAppSiteAssociation()).toThrow(
        'iOS Universal Links configuration is missing',
      );
    });

    it('should include redirect URIs in applinks paths', () => {
      const result = controller.getAppleAppSiteAssociation();

      expect(result.applinks.details[0].paths).toContain(
        mockOAuth2Config.auth.mobile_redirect_uri,
      );
      expect(result.applinks.details[0].paths).toContain(
        mockOAuth2Config.service.mobile_redirect_uri,
      );
    });
  });
});
