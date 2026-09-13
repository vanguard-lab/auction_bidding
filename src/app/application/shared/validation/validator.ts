/**
 * Lightweight validation result.
 */
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface Validator<T> {
  validate(value: T): ValidationResult;
}
