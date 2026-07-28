import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { LoanApplication, LoanApplicationInput } from '../models/domain.models';

/** Заявки на продукт через REST. Требуют JWT (добавляет authInterceptor). */
@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  list(): Observable<LoanApplication[]> {
    return this.http.get<LoanApplication[]>(`${this.config.restBaseUrl}/applications`);
  }

  create(input: LoanApplicationInput): Observable<LoanApplication> {
    return this.http.post<LoanApplication>(
      `${this.config.restBaseUrl}/applications`,
      input,
    );
  }
}
