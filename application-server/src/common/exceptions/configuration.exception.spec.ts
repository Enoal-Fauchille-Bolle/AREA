import { ConfigurationException } from './configuration.exception';

describe('ConfigurationException', () => {
  it('should create an instance with a message', () => {
    const message = 'Configuration error occurred';
    const exception = new ConfigurationException(message);

    expect(exception).toBeInstanceOf(ConfigurationException);
    expect(exception.message).toBe(message);
  });

  it('should be an instance of Error', () => {
    const exception = new ConfigurationException('Test error');
    expect(exception).toBeInstanceOf(Error);
  });

  it('should have the correct name property', () => {
    const exception = new ConfigurationException('Test error');
    expect(exception.name).toBe('ConfigurationException');
  });

  it('should preserve the error message', () => {
    const messages = [
      'Invalid configuration',
      'Missing required environment variable',
      'Database connection failed',
      'OAuth2 credentials not found',
    ];

    for (const message of messages) {
      const exception = new ConfigurationException(message);
      expect(exception.message).toBe(message);
    }
  });

  it('should be throwable', () => {
    const message = 'Configuration is invalid';

    expect(() => {
      throw new ConfigurationException(message);
    }).toThrow(ConfigurationException);

    expect(() => {
      throw new ConfigurationException(message);
    }).toThrow(message);
  });

  it('should be catchable as Error', () => {
    try {
      throw new ConfigurationException('Test error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ConfigurationException);
    }
  });

  it('should maintain error stack trace', () => {
    const exception = new ConfigurationException('Test error');
    expect(exception.stack).toBeDefined();
    expect(exception.stack).toContain('ConfigurationException');
  });

  it('should handle empty message', () => {
    const exception = new ConfigurationException('');
    expect(exception.message).toBe('');
    expect(exception.name).toBe('ConfigurationException');
  });

  it('should handle multi-line messages', () => {
    const message = `Configuration error:
- Missing JWT_SECRET
- Invalid PORT number`;

    const exception = new ConfigurationException(message);
    expect(exception.message).toBe(message);
  });

  it('should handle special characters in message', () => {
    const message = "Configuration error: 'key' not found in {config: 'value'}";
    const exception = new ConfigurationException(message);
    expect(exception.message).toBe(message);
  });
});
