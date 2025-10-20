import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VariableInterpolationService {
  private readonly logger = new Logger(VariableInterpolationService.name);

  /**
   * Interpolates variables in a string using {{variable_name}} syntax
   * @param template - String containing variables to interpolate
   * @param variables - Object containing variable values
   * @returns Interpolated string with variables replaced
   */
  interpolate(template: string, variables: Record<string, unknown>): string {
    if (!template || typeof template !== 'string') {
      return template;
    }

    // Regular expression to match {{variable_name}} patterns
    const variablePattern = /\{\{([^}]+)\}\}/g;

    return template.replace(variablePattern, (match, variableName: string) => {
      const trimmedVariableName = variableName.trim();

      if (trimmedVariableName in variables) {
        const value = variables[trimmedVariableName];

        // Convert value to string, handling different types appropriately
        if (value === null || value === undefined) {
          this.logger.warn(
            `Variable '${trimmedVariableName}' is null or undefined, using empty string`,
          );
          return '';
        }

        if (typeof value === 'object') {
          return JSON.stringify(value);
        }

        if (typeof value === 'string') {
          return value;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }

        // For other types, fallback to empty string
        this.logger.warn(
          `Variable '${trimmedVariableName}' has unsupported type '${typeof value}', using empty string`,
        );
        return '';
      } else {
        this.logger.warn(
          `Variable '${trimmedVariableName}' not found in available variables: ${Object.keys(variables).join(', ')}`,
        );
        // Return the original placeholder if variable not found
        return match;
      }
    });
  }

  /**
   * Checks if a string contains variable placeholders
   * @param template - String to check
   * @returns true if the string contains {{variable}} patterns
   */
  hasVariables(template: string): boolean {
    if (!template || typeof template !== 'string') {
      return false;
    }

    const variablePattern = /\{\{[^}]+\}\}/;
    return variablePattern.test(template);
  }

  /**
   * Extracts all variable names from a template string
   * @param template - String containing variables to extract
   * @returns Array of variable names found in the template
   */
  extractVariableNames(template: string): string[] {
    if (!template || typeof template !== 'string') {
      return [];
    }

    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = variablePattern.exec(template)) !== null) {
      if (match[1]) {
        const variableName = match[1].trim();
        if (!variables.includes(variableName)) {
          variables.push(variableName);
        }
      }
    }

    return variables;
  }

  /**
   * Interpolates all string values in an object recursively
   * @param obj - Object containing values to interpolate
   * @param variables - Object containing variable values
   * @returns New object with interpolated values
   */
  interpolateObject(
    obj: Record<string, unknown>,
    variables: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.interpolate(value, variables);
      } else if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result[key] = this.interpolateObject(
          value as Record<string, unknown>,
          variables,
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
