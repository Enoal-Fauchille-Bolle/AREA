/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Google OAuth2 Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login-oauth2', () => {
    it('should return 400 when Google OAuth2 is not configured', () => {
      return request(app.getHttpServer())
        .post('/auth/login-oauth2')
        .send({
          service: 'google',
          code: 'test-code',
          redirect_uri: 'http://localhost:8081/service/callback',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Google OAuth2 is not configured');
        });
    });

    it('should return 400 when service is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/login-oauth2')
        .send({
          code: 'test-code',
          redirect_uri: 'http://localhost:8081/service/callback',
        })
        .expect(400);
    });

    it('should return 400 when code is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/login-oauth2')
        .send({
          service: 'google',
          redirect_uri: 'http://localhost:8081/service/callback',
        })
        .expect(400);
    });

    it('should return 400 when redirect_uri is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/login-oauth2')
        .send({
          service: 'google',
          code: 'test-code',
        })
        .expect(400);
    });

    it('should return 401 when service is not supported', () => {
      return request(app.getHttpServer())
        .post('/auth/login-oauth2')
        .send({
          service: 'unknown',
          code: 'test-code',
          redirect_uri: 'http://localhost:8081/service/callback',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('not yet implemented');
        });
    });
  });

  describe('POST /auth/register-oauth2', () => {
    it('should return 400 when Google OAuth2 is not configured', () => {
      return request(app.getHttpServer())
        .post('/auth/register-oauth2')
        .send({
          service: 'google',
          code: 'test-code',
          redirect_uri: 'http://localhost:8081/service/callback',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Google OAuth2 is not configured');
        });
    });

    it('should return 400 when required fields are missing', () => {
      return request(app.getHttpServer())
        .post('/auth/register-oauth2')
        .send({
          service: 'google',
        })
        .expect(400);
    });
  });

  describe('Integration: Full OAuth2 flow (mocked)', () => {
    // This test would require mocking the Google OAuth2 endpoints
    // For a real e2e test, you would:
    // 1. Mock fetch to return valid token responses
    // 2. Mock fetch to return valid user info
    // 3. Test the full flow from code to JWT token
    // 4. Verify user is created in database
    // 5. Verify tokens are stored in user_services

    it.todo('should complete full OAuth2 flow with mocked Google responses');
  });
});
