import { AreaParameter } from './area-parameter.entity';

describe('AreaParameter Entity', () => {
  it('should create area parameter instance', () => {
    const areaParameter = new AreaParameter();
    areaParameter.area_id = 1;
    areaParameter.variable_id = 2;
    areaParameter.value = 'test value';

    expect(areaParameter.area_id).toBe(1);
    expect(areaParameter.variable_id).toBe(2);
    expect(areaParameter.value).toBe('test value');
  });

  it('should handle text value', () => {
    const areaParameter = new AreaParameter();
    const longText = 'a'.repeat(1000);
    areaParameter.value = longText;

    expect(areaParameter.value).toBe(longText);
  });
});
