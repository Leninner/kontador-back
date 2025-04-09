import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(@Inject('SENTRY') private readonly sentry: any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        this.sentry.captureException(error)
        return throwError(() => error as Error)
      }),
    )
  }
}
