import { AuthResponseDto } from './auth-response.dto';

describe('AuthResponseDto', () => {
  it('should create instance with token', () => {
    const token = 'jwt_token_123';
    const dto = new AuthResponseDto(token);

    expect(dto.token).toBe(token);
  });

  it('should handle empty token', () => {
    const dto = new AuthResponseDto('');

    expect(dto.token).toBe('');
  });

  it('should handle long token', () => {
    const longToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const dto = new AuthResponseDto(longToken);

    expect(dto.token).toBe(longToken);
  });
});
