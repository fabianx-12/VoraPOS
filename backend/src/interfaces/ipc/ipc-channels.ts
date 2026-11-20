import { CheckoutRequestDTO } from '../../modules/sales/dtos/checkout.dto.js';
import { Sale } from '../../modules/sales/domain/sale.entity.js';
import { VoidSaleInput } from '../../modules/sales/use-cases/void-sale.use-case.js';

export interface IpcChannelMap {
  'sales:create': {
    request: CheckoutRequestDTO;
    response: Sale;
  };
  'sales:void': {
    request: VoidSaleInput;
    response: { success: true };
  };
  'printer:status': {
    request: void;
    response: { status: 'READY' | 'OUT_OF_PAPER' | 'OFFLINE' | 'JAMMED' };
  };
}

export type IpcChannelName = keyof IpcChannelMap;
