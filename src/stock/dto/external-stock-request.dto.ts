export class ExternalStockRequestDto {
  serviceKey: string; // 공공데이터포털에서 받은 인증키
  numOfRows?: number; // 한 페이지 결과 수
  pageNo?: number; // 페이지 번호
  resultType?: string; // 구분(xml, json) Default: xml
  basDt?: string; // 검색값과 기준일자가 일치하는 데이터를 검색
  beginBasDt?: string; // 기준일자가 검색값보다 크거나 같은 데이터를 검색
  endBasDt?: string; // 기준일자가 검색값보다 작은 데이터를 검색
  likeBasDt?: string; // 기준일자값이 검색값을 포함하는 데이터를 검색
  likeSrtnCd?: string; // 단축코드가 검색값을 포함하는 데이터를 검색
  isinCd?: string; // 검색값과 ISIN코드이 일치하는 데이터를 검색
  likeIsinCd?: string; // ISIN코드가 검색값을 포함하는 데이터를 검색
  itmsNm?: string; // 검색값과 종목명이 일치하는 데이터를 검색
  likeItmsNm?: string; // 종목명이 검색값을 포함하는 데이터를 검색
  mrktCls?: string; // 검색값과 시장구분이 일치하는 데이터를 검색
  beginVs?: string; // 대비가 검색값보다 크거나 같은 데이터를 검색
  endVs?: string; // 대비가 검색값보다 작은 데이터를 검색
  beginFltRt?: string; // 등락률이 검색값보다 크거나 같은 데이터를 검색
  endFltRt?: string; // 등락률이 검색값보다 작은 데이터를 검색
  beginTrqu?: string; // 거래량이 검색값보다 크거나 같은 데이터를 검색
  endTrqu?: string; // 거래량이 검색값보다 작은 데이터를 검색
  beginTrPrc?: string; // 거래대금이 검색값보다 크거나 같은 데이터를 검색
  endTrPrc?: string; // 거래대금이 검색값보다 작은 데이터를 검색
  beginLstgStCnt?: string; // 상장주식수가 검색값보다 크거나 같은 데이터를 검색
  endLstgStCnt?: string; // 상장주식수가 검색값보다 작은 데이터를 검색
  beginMrktTotAmt?: string; // 시가총액이 검색값보다 크거나 같은 데이터를 검색
  endMrktTotAmt?: string; // 시가총액이 검색값보다 작은 데이터를 검색
}
