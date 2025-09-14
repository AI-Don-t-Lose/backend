class StockItemDto {
  basDt: string; // 기준일자 (Base Date)
  srtnCd: string; // 단축코드 (Short Code)
  isinCd: string; // ISIN코드 (ISIN Code)
  itmsNm: string; // 종목명 (Item Name)
  mrktCtg: string; // 시장구분 (Market Category)
  clpr: string; // 종가 (Closing Price)
  vs: string; // 대비 (Comparison)
  fltRt: string; // 등락률 (Fluctuation Rate)
  mkp: string; // 시가 (Market Price)
  hipr: string; // 고가 (High Price)
  lopr: string; // 저가 (Low Price)
  trqu: string; // 거래량 (Trading Volume)
  trPrc: string; // 거래대금 (Trading Price)
  lstgStCnt: string; // 상장주식수 (Listed Stock Count)
  mrktTotAmt: string; // 시가총액 (Market Total Amount)
}

class StockItemsDto {
  item: StockItemDto[];
}

class StockBodyDto {
  numOfRows: number;
  pageNo: number;
  totalCount: number;
  items: StockItemsDto;
}

class StockHeaderDto {
  resultCode: string;
  resultMsg: string;
}

export class ExternalStockResponseDto {
  header: StockHeaderDto;
  body: StockBodyDto;
}
