import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { UserServicesService } from '../services/user-services/user-services.service';
import { ServicesService } from '../services/services.service';
import { Area } from '../areas/entities/area.entity';

interface AddToPlaylistParams {
  playlist_id: string;
  track_uri: string;
}

interface AddToQueueParams {
  track_uri: string;
}

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);

  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
    private readonly userServicesService: UserServicesService,
    private readonly servicesService: ServicesService,
  ) {}

  /**
   * Add track to playlist reaction
   */
  async addToPlaylistReaction(
    executionId: number,
    areaId: number,
  ): Promise<void> {
    await this.addToPlaylist(executionId, areaId);
  }

  /**
   * Add track to queue reaction
   */
  async addToQueueReaction(executionId: number, areaId: number): Promise<void> {
    await this.addToQueue(executionId, areaId);
  }

  /**
   * Process any Spotify reaction (backward compatibility)
   * For new code, use specific reaction methods instead
   */
  async processReaction(executionId: number, areaId: number): Promise<void> {
    // Default to add to queue for backward compatibility
    await this.addToQueue(executionId, areaId);
  }

  /**
   * Add a track to a Spotify playlist
   */
  async addToPlaylist(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing add to playlist for execution ${executionId}, area ${areaId}`,
      );

      // Get parameters with variable interpolation
      const params = await this.getPlaylistParameters(areaId, executionId);
      if (!params) {
        throw new Error('Missing required parameters for add to playlist');
      }

      // Get user's Spotify access token
      const accessToken = await this.getUserSpotifyToken(areaId);

      // Add track to playlist using Spotify Web API
      await this.addTrackToPlaylist(accessToken, params);

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Track ${params.track_uri} added successfully to playlist ${params.playlist_id}`,
          playlist_id: params.playlist_id,
          track_uri: params.track_uri,
          added_at: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Successfully added track to playlist for execution ${executionId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to add track to playlist for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      await this.areaExecutionsService.failExecution(executionId, errorMessage);
      throw error;
    }
  }

  /**
   * Add a track to user's Spotify playback queue
   */
  async addToQueue(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing add to queue for execution ${executionId}, area ${areaId}`,
      );

      // Get parameters with variable interpolation
      const params = await this.getQueueParameters(areaId, executionId);
      if (!params) {
        throw new Error('Missing required parameters for add to queue');
      }

      // Get user's Spotify access token
      const accessToken = await this.getUserSpotifyToken(areaId);

      // Add track to queue using Spotify Web API
      await this.addTrackToQueue(accessToken, params);

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Track ${params.track_uri} added successfully to playback queue`,
          track_uri: params.track_uri,
          added_at: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Successfully added track to queue for execution ${executionId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to add track to queue for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      await this.areaExecutionsService.failExecution(executionId, errorMessage);
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Get playlist parameters with variable interpolation
   */
  private async getPlaylistParameters(
    areaId: number,
    executionId?: number,
  ): Promise<AddToPlaylistParams | null> {
    try {
      // Get execution context for variable interpolation
      let executionContext: Record<string, unknown> = {};
      if (executionId) {
        const execution = await this.areaExecutionsService.findOne(executionId);
        if (execution.triggerData) {
          executionContext = execution.triggerData;
        }
      }

      // Get parameters with variable interpolation
      const parameters =
        await this.areaParametersService.findByAreaWithInterpolation(
          areaId,
          executionContext,
        );

      const playlistIdParam = parameters.find(
        (p) => p.variable?.name === 'playlist_id',
      );
      const trackUriParam = parameters.find(
        (p) => p.variable?.name === 'track_uri',
      );

      if (!playlistIdParam?.value || !trackUriParam?.value) {
        throw new Error(
          'Required Spotify playlist parameters (playlist_id, track_uri) are not set',
        );
      }

      return {
        playlist_id: playlistIdParam.value,
        track_uri: trackUriParam.value,
      };
    } catch (error) {
      this.logger.error(
        `Error getting playlist parameters for area ${areaId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get queue parameters with variable interpolation
   */
  private async getQueueParameters(
    areaId: number,
    executionId?: number,
  ): Promise<AddToQueueParams | null> {
    try {
      // Get execution context for variable interpolation
      let executionContext: Record<string, unknown> = {};
      if (executionId) {
        const execution = await this.areaExecutionsService.findOne(executionId);
        if (execution.triggerData) {
          executionContext = execution.triggerData;
        }
      }

      // Get parameters with variable interpolation
      const parameters =
        await this.areaParametersService.findByAreaWithInterpolation(
          areaId,
          executionContext,
        );

      const trackUriParam = parameters.find(
        (p) => p.variable?.name === 'track_uri',
      );

      if (!trackUriParam?.value) {
        throw new Error(
          'Required Spotify queue parameter (track_uri) is not set',
        );
      }

      return {
        track_uri: trackUriParam.value,
      };
    } catch (error) {
      this.logger.error(
        `Error getting queue parameters for area ${areaId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get user's Spotify access token for the given area
   */
  private async getUserSpotifyToken(areaId: number): Promise<string> {
    try {
      // Get the area to find the user
      const area = await this.areaRepository.findOne({
        where: { id: areaId },
      });

      if (!area) {
        throw new BadRequestException(`Area ${areaId} not found`);
      }

      const userId = area.user_id;

      // Find Spotify service
      const services = await this.servicesService.findAll();
      const spotifyService = services.find(
        (s) => s.name.toLowerCase() === 'spotify',
      );

      if (!spotifyService) {
        throw new BadRequestException('Spotify service not found');
      }

      // Get user's Spotify service connection
      const userService = await this.userServicesService.findOne(
        userId,
        spotifyService.id,
      );

      if (!userService || !userService.oauth_token) {
        throw new BadRequestException(
          'User does not have Spotify connected or no OAuth token available',
        );
      }

      // Check if token is expired or expires soon (within 5 minutes) and refresh if needed
      const tokenExpiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
      if (
        userService.token_expires_at &&
        new Date(userService.token_expires_at).getTime() <=
          new Date().getTime() + tokenExpiryBuffer
      ) {
        this.logger.log(
          `Spotify token expired for user ${userId}, refreshing...`,
        );

        try {
          await this.servicesService.refreshServiceToken(
            userId,
            spotifyService.id,
          );

          // Fetch the updated token
          const refreshedUserService = await this.userServicesService.findOne(
            userId,
            spotifyService.id,
          );

          if (!refreshedUserService || !refreshedUserService.oauth_token) {
            throw new BadRequestException(
              'Failed to refresh Spotify access token - no token received',
            );
          }

          this.logger.log(
            `Successfully refreshed Spotify token for user ${userId}`,
          );
          return refreshedUserService.oauth_token;
        } catch (refreshError) {
          const refreshErrorMessage =
            refreshError instanceof Error
              ? refreshError.message
              : 'Unknown refresh error';

          this.logger.error(
            `Failed to refresh Spotify token for user ${userId}: ${refreshErrorMessage}`,
          );

          throw new BadRequestException(
            `Failed to refresh Spotify access token: ${refreshErrorMessage}. Please re-authenticate your Spotify account.`,
          );
        }
      }

      return userService.oauth_token;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to get Spotify token: ${errorMessage}`,
      );
    }
  }

  /**
   * Add a track to a Spotify playlist using the Web API
   */
  private async addTrackToPlaylist(
    accessToken: string,
    params: AddToPlaylistParams,
  ): Promise<void> {
    try {
      const url = `https://api.spotify.com/v1/playlists/${params.playlist_id}/tracks`;

      const requestBody = {
        uris: [params.track_uri],
        position: 0, // Add to the beginning of the playlist
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Spotify API returned status ${response.status}: ${response.statusText}`,
        );
      }

      this.logger.log(
        `Successfully added track ${params.track_uri} to playlist ${params.playlist_id}`,
      );
    } catch (error) {
      this.handleSpotifyApiError(error, 'Failed to add track to playlist');
    }
  }

  /**
   * Add a track to user's Spotify playback queue using the Web API
   */
  private async addTrackToQueue(
    accessToken: string,
    params: AddToQueueParams,
  ): Promise<void> {
    try {
      console.log(params.track_uri);
      const url = `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(params.track_uri)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Spotify API returned status ${response.status}: ${response.statusText}`,
        );
      }

      this.logger.log(
        `Successfully added track ${params.track_uri} to playback queue`,
      );
    } catch (error) {
      this.handleSpotifyApiError(error, 'Failed to add track to queue');
    }
  }

  /**
   * Handle Spotify API errors in a type-safe way
   */
  private handleSpotifyApiError(error: unknown, context: string): never {
    // Check if it's a fetch Response error (from !response.ok)
    if (
      error instanceof Error &&
      error.message.includes('Spotify API returned status')
    ) {
      // Extract status code from error message
      const statusMatch = error.message.match(/status (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1], 10);

        // Handle specific Spotify API errors
        switch (status) {
          case 401:
            throw new Error('Spotify access token is invalid or expired');
          case 403:
            throw new Error(
              'User does not have an active Spotify Premium subscription or insufficient permissions',
            );
          case 404:
            throw new Error(
              'Resource not found, playlist/track URI is invalid, or no active playback device',
            );
          case 400:
            throw new Error('Bad request: Invalid parameters');
          default:
            throw new Error(`Spotify API error (${status}): Unknown error`);
        }
      }
    }

    throw new Error(
      `${context}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
