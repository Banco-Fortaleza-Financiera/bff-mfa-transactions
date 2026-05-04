import { paginationFromHeaders } from './pagination.util';

describe('paginationFromHeaders', () => {
  it('uses header values when they are present', () => {
    const headers = new Headers({
      'x-page': '2',
      'x-page-size': '20',
      'x-total-count': '45',
      'x-total-pages': '3',
    });

    expect(paginationFromHeaders(headers, { page: 1, pageSize: 10 })).toEqual({
      page: 2,
      pageSize: 20,
      totalCount: 45,
      totalPages: 3,
    });
  });

  it('uses fallback values and calculates total pages when headers are missing', () => {
    const headers = new Headers({
      'x-total-count': '21',
    });

    expect(paginationFromHeaders(headers, { page: 1, pageSize: 10 })).toEqual({
      page: 1,
      pageSize: 10,
      totalCount: 21,
      totalPages: 3,
    });
  });

  it('keeps page size at least one', () => {
    const headers = new Headers({
      'x-page-size': '0',
    });

    expect(paginationFromHeaders(headers, { page: 1, pageSize: 0 }).pageSize).toBe(1);
  });
});
