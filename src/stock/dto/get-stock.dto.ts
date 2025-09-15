class PriceDto {
  current: number;
  fluctuationRate: number;
  vsAmount: number;
}

export class GetStockDto {
  date: number;
  price: PriceDto;
  name: string;
}
