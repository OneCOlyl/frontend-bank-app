import { join } from 'node:path';
import { credentials, loadPackageDefinition, type ServiceError } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

/**
 * gRPC-клиент банка для BFF-слоя Angular Node-сервера.
 * Браузер не умеет говорить по «сырому» gRPC (HTTP/2 + protobuf), поэтому вызовы
 * идут через Node: браузер → /bff/grpc/* → (grpc-js) → backend :50051.
 * Это стандартный прод-паттерн (backend-for-frontend), а не костыль.
 */

const PROTO_PATH = join(process.cwd(), 'proto', 'bank.proto');
const GRPC_TARGET = process.env['GRPC_TARGET'] ?? 'localhost:50051';

export interface GrpcCurrencyRate {
  code: string;
  nominal: number;
  buy: number;
  sell: number;
  updatedAt: string;
}

const packageDef = loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Типы genrated-клиента нам неизвестны статически — грузим как any и оборачиваем в типобезопасный фасад.
const proto = loadPackageDefinition(packageDef) as any;
const client = new proto.bank.BankService(GRPC_TARGET, credentials.createInsecure());

/** Возвращает курсы валют из gRPC-бэкенда. Промис — удобно для async-роута Express. */
export function listRatesViaGrpc(): Promise<GrpcCurrencyRate[]> {
  return new Promise((resolve, reject) => {
    client.ListRates({}, (err: ServiceError | null, res: { rates: GrpcCurrencyRate[] }) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res.rates);
    });
  });
}
