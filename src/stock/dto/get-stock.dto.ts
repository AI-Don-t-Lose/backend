class PriceDto {
  current: number;
  fluctuationRate: number;
  vsAmount: number;
}

export class GetStockDto {
  date: Date;
  price: PriceDto;
  name: string;
}
