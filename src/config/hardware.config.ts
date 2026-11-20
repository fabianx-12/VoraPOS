export interface HardwareConfig {
  printer: {
    paperWidthMm: 58 | 80;
    charactersPerLine: number;
    encoding: string;
    autoCut: boolean;
    openDrawerOnCashSale: boolean;
  };
  drawer: {
    pin: 2 | 5;
    onTimeMs: number;
    offTimeMs: number;
  };
}

export const hardwareConfig: HardwareConfig = {
  printer: {
    paperWidthMm: 80,
    charactersPerLine: 48,
    encoding: 'CP850',
    autoCut: true,
    openDrawerOnCashSale: true,
  },
  drawer: {
    pin: 2,
    onTimeMs: 50,
    offTimeMs: 50,
  },
};
