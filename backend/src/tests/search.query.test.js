const { buildSearchBody } = require('../services/search');

describe('buildSearchBody', () => {
  it('with no text and no filters: match_all, only active products of approved vendors, newest first', () => {
    const body = buildSearchBody({ page: 1, limit: 12 });
    expect(body.query.bool.must).toEqual([{ match_all: {} }]);
    expect(body.query.bool.filter).toEqual([{ term: { isActive: true } }, { term: { vendorApproved: true } }]);
    expect(body.sort).toEqual([{ createdAt: 'desc' }]);
    expect(body.post_filter).toBeUndefined();
  });

  it('with text: fuzzy multi_match, title weighted highest, relevance sort starts with _score', () => {
    const body = buildSearchBody({ q: 'iphne', sort: 'relevance', page: 1, limit: 12 });
    const mm = body.query.bool.must[0].multi_match;
    expect(mm.query).toBe('iphne');
    expect(mm.fuzziness).toBe('AUTO');
    expect(mm.fields[0]).toBe('title^3');
    expect(body.sort[0]).toBe('_score');
  });

  it('price range with both bounds, or only a minimum', () => {
    const both = buildSearchBody({ minPrice: 100, maxPrice: 500, page: 1, limit: 12 });
    expect(both.query.bool.filter).toContainEqual({ range: { price: { gte: 100, lte: 500 } } });
    const minOnly = buildSearchBody({ minPrice: 100, page: 1, limit: 12 });
    expect(minOnly.query.bool.filter).toContainEqual({ range: { price: { gte: 100 } } });
  });

  it('minimum rating filter', () => {
    const body = buildSearchBody({ rating: 4, page: 1, limit: 12 });
    expect(body.query.bool.filter).toContainEqual({ range: { ratingAvg: { gte: 4 } } });
  });

  it('category goes into post_filter so category counts still show other categories', () => {
    const body = buildSearchBody({ category: 'laptops', page: 1, limit: 12 });
    expect(body.post_filter).toEqual({ term: { category: 'laptops' } });
    expect(body.query.bool.filter).not.toContainEqual({ term: { category: 'laptops' } });
    expect(body.aggs.categories.terms.field).toBe('category');
  });

  it('sort options', () => {
    expect(buildSearchBody({ sort: 'price_asc', page: 1, limit: 12 }).sort).toEqual([{ price: 'asc' }]);
    expect(buildSearchBody({ sort: 'price_desc', page: 1, limit: 12 }).sort).toEqual([{ price: 'desc' }]);
    expect(buildSearchBody({ sort: 'rating', page: 1, limit: 12 }).sort[0]).toEqual({ ratingAvg: 'desc' });
  });

  it('pagination offsets', () => {
    const body = buildSearchBody({ page: 3, limit: 10 });
    expect(body.from).toBe(20);
    expect(body.size).toBe(10);
  });
});
