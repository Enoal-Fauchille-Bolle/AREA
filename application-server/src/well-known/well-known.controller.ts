import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Universal Links')
@Controller('.well-known')
export class WellKnownController {
  private readonly androidPackageName: string | undefined;
  private readonly androidSha256Fingerprint: string | undefined;
  private readonly iosTeamId: string | undefined;
  private readonly iosBundleId: string | undefined;
  private readonly redirectUris: string[];

  constructor(private readonly configService: ConfigService) {
    const appConfig = this.configService.get('app');
    this.androidPackageName = appConfig.mobile.android.packageName;
    this.androidSha256Fingerprint = appConfig.mobile.android.sha256;
    this.iosTeamId = appConfig.mobile.ios.teamId;
    this.iosBundleId = appConfig.mobile.ios.bundleId;
    this.redirectUris = [
      appConfig.oauth2.auth.mobile_redirect_uri,
      appConfig.oauth2.service.mobile_redirect_uri,
    ];
  }

  @Get('assetlinks.json')
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary:
      'Get the Digital Asset Links file for Android deep linking Universal Links.',
  })
  @ApiResponse({
    status: 200,
    description: 'The Digital Asset Links JSON.',
  })
  getAssetLinks() {
    if (!this.androidPackageName || !this.androidSha256Fingerprint) {
      throw new Error('Android configuration is not properly set');
    }
    return [
      {
        relations: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: this.androidPackageName,
          sha256_cert_fingerprints: [this.androidSha256Fingerprint],
        },
      },
    ];
  }

  @Get('apple-app-site-association')
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary:
      'Get the Apple App Site Association file for iOS deep linking Universal Links.',
  })
  @ApiResponse({
    status: 200,
    description: 'The Apple App Site Association JSON.',
  })
  getAppleAppSiteAssociation() {
    if (!this.iosTeamId || !this.iosBundleId) {
      throw new Error('iOS configuration is not properly set');
    }
    return {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${this.iosTeamId}.${this.iosBundleId}`,
            paths: this.redirectUris,
          },
        ],
      },
      webcredentials: {
        apps: [`${this.iosTeamId}.${this.iosBundleId}`],
      },
    };
  }
}
