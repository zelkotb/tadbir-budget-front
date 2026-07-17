/** Mirrors Spring Data's Page<T> JSON response shape. */
export interface Page<T> {
    content:       T[];
    totalElements: number;
    totalPages:    number;
    size:          number;
    number:        number;
    first:         boolean;
    last:          boolean;
    empty:         boolean;
}
