export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginationResponseParams {
  actualPage: number;
  actualPerPage: number;
  totalItemsCount: number;
}
