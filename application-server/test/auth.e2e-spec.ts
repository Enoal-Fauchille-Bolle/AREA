import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersService = moduleFixture.get<UsersService>(UsersService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test users before each test
    const testEmails = ['test@example.com', 'other@example.com', 'different@example.com'];
    for (const email of testEmails) {
      try {
        const user = await usersService.findByEmail(email);
        if (user) {
          await usersService.remove(user.id);
        }
      } catch (error) {
        // User doesn't exist, which is fine
      }
    }
  });

  describe('/auth/register (POST)', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(validUserData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(typeof res.body.token).toBe('string');
          expect(res.body.token.length).toBeGreaterThan(0);
        });
    });

    it('should return 409 when email already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(validUserData)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email already in use');
        });
    });

    it('should return 409 when username already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same username but different email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'different@example.com',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Username already in use');
        });
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          // missing username and password
        })
        .expect(409); // Returns conflict due to validation failures
    });
  });

  describe('/auth/login (POST)', () => {
    const userCredentials = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    beforeEach(async () => {
      // Create a test user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userCredentials)
        .expect(201);
    });

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(typeof res.body.token).toBe('string');
        });
    });

    it('should reject login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should reject login with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should reject login with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.email,
          // missing password
        })
        .expect(401); // Passport returns 401 for missing credentials
    });
  });

  describe('/auth/me (GET)', () => {
    let authToken: string;
    const userCredentials = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    beforeEach(async () => {
      // Register and get auth token
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userCredentials)
        .expect(201);
      
      authToken = registerRes.body.token;
    });

    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', userCredentials.email);
          expect(res.body).toHaveProperty('username', userCredentials.username);
          expect(res.body).toHaveProperty('is_admin');
          expect(res.body).toHaveProperty('is_active');
          expect(res.body).toHaveProperty('created_at');
          expect(res.body).toHaveProperty('updated_at');
          expect(res.body).not.toHaveProperty('password_hash');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Unauthorized');
        });
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Unauthorized');
        });
    });

    it('should reject request with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });

  describe('/auth/me (PATCH)', () => {
    let authToken: string;
    const userCredentials = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    beforeEach(async () => {
      // Register and get auth token
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userCredentials)
        .expect(201);
      
      authToken = registerRes.body.token;
    });

    it('should update user profile successfully', () => {
      const updateData = {
        username: 'uniqueupdateduser',
        icon_url: 'https://example.com/avatar.png',
      };

      return request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe(updateData.username);
          expect(res.body.updated_at).toBeDefined();
        });
    });

    it('should update password successfully', () => {
      return request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'newpassword123' })
        .expect(200);
    });

    it('should reject duplicate username', async () => {
      // Create another user with a different username
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          username: 'otheruser',
          password: 'password123',
        })
        .expect(201);

      // Try to update to the existing username
      return request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: 'otheruser' })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Username already in use');
        });
    });

    it('should reject duplicate email', async () => {
      // Create another user with a different email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          username: 'otheruser',
          password: 'password123',
        })
        .expect(201);

      // Try to update to the existing email
      return request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'other@example.com' })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email already in use');
        });
    });

    it('should reject unauthorized request', () => {
      return request(app.getHttpServer())
        .patch('/auth/me')
        .send({ username: 'newusername' })
        .expect(401);
    });
  });

  describe('/auth/me (DELETE)', () => {
    let authToken: string;
    const userCredentials = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    beforeEach(async () => {
      // Register and get auth token
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userCredentials)
        .expect(201);
      
      authToken = registerRes.body.token;
    });

    it('should delete user account successfully', () => {
      return request(app.getHttpServer())
        .delete('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should reject unauthorized delete request', () => {
      return request(app.getHttpServer())
        .delete('/auth/me')
        .expect(401);
    });

    it('should not be able to access profile after deletion', async () => {
      // Delete the account
      await request(app.getHttpServer())
        .delete('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Try to access profile with same token
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });

  describe('OAuth2 Endpoints (Placeholders)', () => {
    it('should return error for OAuth2 login (not implemented)', () => {
      return request(app.getHttpServer())
        .post('/auth/login-oauth2')
        .send({
          service: 'google',
          code: 'test_code',
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toContain('Internal server error');
        });
    });

    it('should return error for OAuth2 register (not implemented)', () => {
      return request(app.getHttpServer())
        .post('/auth/register-oauth2')
        .send({
          service: 'google',
          code: 'test_code',
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toContain('Internal server error');
        });
    });
  });

  describe('JWT Token Validation', () => {
    let authToken: string;
    const userCredentials = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    beforeEach(async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userCredentials)
        .expect(201);
      
      authToken = registerRes.body.token;
    });

    it('should accept valid JWT format', () => {
      expect(authToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    it('should work with token from login endpoint', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password,
        })
        .expect(200);

      const loginToken = loginRes.body.token;

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);
    });

    it('should update last_connection_at on login', async () => {
      // Get initial profile
      const initialProfile = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Login again
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password,
        })
        .expect(200);

      // Get updated profile
      const updatedProfile = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(new Date(updatedProfile.body.last_connection_at)).toBeInstanceOf(Date);
      expect(updatedProfile.body.last_connection_at).not.toBe(initialProfile.body.last_connection_at);
    });
  });
});