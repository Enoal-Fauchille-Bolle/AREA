import { validate } from 'class-validator';
import { LinkServiceDto, LinkPlatform } from './link-service.dto';

describe('LinkServiceDto', () => {
  it('should create empty instance', () => {
    const dto = new LinkServiceDto();

    expect(dto.code).toBeUndefined();
    expect(dto.platform).toBeUndefined();
  });

  it('should validate when both code and platform are provided', async () => {
    const dto = new LinkServiceDto();
    dto.code = 'auth_code_123';
    dto.platform = LinkPlatform.WEB;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate when both code and platform are missing', async () => {
    const dto = new LinkServiceDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate when only code is provided with ValidateIf', async () => {
    const dto = new LinkServiceDto();
    dto.code = 'auth_code_123';

    const errors = await validate(dto);
    // ValidateIf makes platform optional when only code is provided
    expect(errors).toHaveLength(0);
  });

  it('should validate when only platform is provided with ValidateIf', async () => {
    const dto = new LinkServiceDto();
    dto.platform = LinkPlatform.MOBILE;

    const errors = await validate(dto);
    // ValidateIf makes code optional when only platform is provided
    expect(errors).toHaveLength(0);
  });

  it('should support WEB platform', async () => {
    const dto = new LinkServiceDto();
    dto.code = 'auth_code';
    dto.platform = LinkPlatform.WEB;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.platform).toBe('web');
  });

  it('should support MOBILE platform', async () => {
    const dto = new LinkServiceDto();
    dto.code = 'auth_code';
    dto.platform = LinkPlatform.MOBILE;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.platform).toBe('mobile');
  });

  it('should fail with invalid platform', async () => {
    const dto = new LinkServiceDto();
    dto.code = 'auth_code';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    dto.platform = 'invalid' as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
