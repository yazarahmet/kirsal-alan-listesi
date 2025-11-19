export interface YerlesimYeri {
  il: string;
  ilce: string;
  belediye: string;
  mahalle: string;
  durum: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
