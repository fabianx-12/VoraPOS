import { ZodSchema } from 'zod';
import { IpcChannelMap, IpcChannelName } from './ipc-channels.js';
import { DomainError } from '../../shared/errors/domain.error.js';

export type IpcHandlerFn<TReq, TRes> = (payload: TReq) => Promise<TRes> | TRes;

interface RegisteredRoute<TReq, TRes> {
  schema?: ZodSchema<TReq>;
  handler: IpcHandlerFn<TReq, TRes>;
}

/**
 * Type-Safe IPC Message Router with Zod runtime validation middleware
 * and standardized error envelope serialization.
 */
export class IpcRouter {
  private readonly routes = new Map<string, RegisteredRoute<unknown, unknown>>();

  public register<K extends IpcChannelName>(
    channel: K,
    handler: IpcHandlerFn<IpcChannelMap[K]['request'], IpcChannelMap[K]['response']>,
    schema?: ZodSchema<IpcChannelMap[K]['request']>
  ): void {
    this.routes.set(channel, {
      schema: schema as ZodSchema<unknown> | undefined,
      handler: handler as IpcHandlerFn<unknown, unknown>,
    });
  }

  public async dispatch<K extends IpcChannelName>(
    channel: K,
    rawPayload: unknown
  ): Promise<
    | { success: true; data: IpcChannelMap[K]['response'] }
    | { success: false; error: { code: string; message: string; details?: unknown } }
  > {
    const route = this.routes.get(channel);
    if (!route) {
      return {
        success: false,
        error: {
          code: 'CHANNEL_NOT_FOUND',
          message: `No IPC handler registered for channel: "${channel}"`,
        },
      };
    }

    try {
      // 1. Zod Validation Middleware
      let validatedPayload = rawPayload;
      if (route.schema) {
        const validationResult = route.schema.safeParse(rawPayload);
        if (!validationResult.success) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Invalid IPC request payload',
              details: validationResult.error.format(),
            },
          };
        }
        validatedPayload = validationResult.data;
      }

      // 2. Handler Execution
      const result = await route.handler(validatedPayload);
      return {
        success: true,
        data: result as IpcChannelMap[K]['response'],
      };
    } catch (err) {
      if (err instanceof DomainError) {
        return {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        };
      }

      const unexpectedMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: unexpectedMessage,
        },
      };
    }
  }
}
