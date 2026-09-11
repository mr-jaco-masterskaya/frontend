export type ClientSearchState = {
  loading: boolean;
  error: string | null;
  searched: boolean;
};

// API отдаёт клиента только по полному номеру телефона, поэтому до поиска
// экрану нечего показывать и состояние нужно объяснять оператору явно.
export function emptyStateMessage({ loading, error, searched }: ClientSearchState): string {
  if (loading) return "Ищем клиента…";
  if (error) return error;
  if (searched) return "Клиент с таким номером не найден";
  return "Введите номер телефона клиента и нажмите «Найти»";
}
