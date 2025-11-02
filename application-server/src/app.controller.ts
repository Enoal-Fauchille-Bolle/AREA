import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { Request } from 'express';

@ApiTags('About')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'Get AREA server information',
    description:
      'Returns information about the AREA server including available services, actions, and reactions. ' +
      'This endpoint provides a complete overview of all automation capabilities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Server information and available services',
    schema: {
      type: 'object',
      properties: {
        client: {
          type: 'object',
          properties: {
            host: {
              type: 'string',
              example: '127.0.0.1',
              description: 'Client IP address',
            },
          },
        },
        server: {
          type: 'object',
          properties: {
            current_time: {
              type: 'integer',
              example: 1730563200,
              description: 'Current server time (Unix timestamp)',
            },
            services: {
              type: 'array',
              description:
                'List of available services with their actions and reactions',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'github',
                    description: 'Service name',
                  },
                  actions: {
                    type: 'array',
                    description: 'Available action triggers for this service',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'New Issue' },
                        description: {
                          type: 'string',
                          example: 'Triggered when a new issue is created',
                        },
                      },
                    },
                  },
                  reactions: {
                    type: 'array',
                    description: 'Available reactions for this service',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'Create Issue' },
                        description: {
                          type: 'string',
                          example: 'Creates a new issue in a repository',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @Get('about.json')
  async getAbout(@Req() request: Request): Promise<any> {
    return this.appService.getAbout(request);
  }
}
