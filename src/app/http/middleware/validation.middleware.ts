import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationResult } from '../../application/shared/validation';

/**
 * Joi schema for PlaceBidRequest.
 */
export const placeBidSchema = Joi.object({
  auction_id: Joi.string().uuid().required(),
  user_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
});

/**
 * Middleware that validates request body against a Joi schema.
 * If validation fails, returns 400 with structured errors.
 */
export function validationMiddleware(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors,
      });
      return;
    }
    next();
  };
}

/**
 * Joi schema for SignupRequest.
 */
export const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/**
 * Joi schema for LoginRequest.
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Lightweight validator for SignupRequest.
 */
export class SignupValidator {
  public validate(value: { email?: unknown; password?: unknown }): ValidationResult {
    const { error } = signupSchema.validate(value, { abortEarly: false });
    if (error) {
      return {
        isValid: false,
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      };
    }
    return { isValid: true, errors: [] };
  }
}

/**
 * Lightweight validator for LoginRequest.
 */
export class LoginValidator {
  public validate(value: { email?: unknown; password?: unknown }): ValidationResult {
    const { error } = loginSchema.validate(value, { abortEarly: false });
    if (error) {
      return {
        isValid: false,
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      };
    }
    return { isValid: true, errors: [] };
  }
}

/**
 * Lightweight validator for PlaceBidRequest.
 */
export class PlaceBidValidator {
  public validate(value: { auction_id?: unknown; user_id?: unknown; amount?: unknown }): ValidationResult {
    const { error } = placeBidSchema.validate(value, { abortEarly: false });
    if (error) {
      return {
        isValid: false,
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      };
    }
    return { isValid: true, errors: [] };
  }
}
