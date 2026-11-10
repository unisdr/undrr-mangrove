import { searchRequestKey } from '../utils/searchRequestKey';
import { saveFile } from '../utils/saveFile';

test('request identity ignores volatile now but retains endpoint and query changes', () => {
  const body = now => ({ query: { params: { now }, term: 'flood' } });
  const initial = searchRequestKey('/search', body(1));
  expect(searchRequestKey('/search', body(2))).toBe(initial);
  expect(searchRequestKey('/other-search', body(1))).not.toBe(initial);
  expect(searchRequestKey('/search', { query: { term: 'drought' } })).not.toBe(
    initial
  );
});

function fileDocument() {
  const owner = document.implementation.createHTMLDocument('Download');
  const file = {};
  const view = {
    Blob: jest.fn(() => file),
    URL: {
      createObjectURL: jest.fn(() => 'blob:owned'),
      revokeObjectURL: jest.fn(),
    },
    setTimeout: jest.fn(),
  };
  Object.defineProperty(owner, 'defaultView', { value: view });
  const link = owner.createElement('a');
  jest.spyOn(owner, 'createElement').mockReturnValue(link);
  const click = jest.spyOn(link, 'click').mockImplementation(() => {});
  return { owner, view, link, click, file };
}

test.each([
  ['csv', 'text/csv;charset=utf-8'],
  ['json', 'application/json;charset=utf-8'],
])(
  'saves %s using the supplied document and schedules URL cleanup',
  (format, type) => {
    const { owner, view, link, click, file } = fileDocument();
    saveFile(owner, 'contents', format);
    expect(view.Blob).toHaveBeenCalledWith(['contents'], { type });
    expect(view.URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(link.ownerDocument).toBe(owner);
    expect(link.download).toMatch(
      new RegExp(`^search-results-\\d{4}-\\d{2}-\\d{2}\\.${format}$`)
    );
    expect(click).toHaveBeenCalledTimes(1);
    expect(owner.body.contains(link)).toBe(false);
    expect(view.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    expect(view.URL.revokeObjectURL).not.toHaveBeenCalled();
    view.setTimeout.mock.calls[0][0]();
    expect(view.URL.revokeObjectURL).toHaveBeenCalledWith('blob:owned');
  }
);

test('failed browser activation still removes its anchor and schedules revocation', () => {
  const { owner, view, link, click } = fileDocument();
  click.mockImplementation(() => {
    throw new Error('Blocked');
  });
  expect(() => saveFile(owner, 'contents', 'csv')).toThrow('Blocked');
  expect(owner.body.contains(link)).toBe(false);
  view.setTimeout.mock.calls[0][0]();
  expect(view.URL.revokeObjectURL).toHaveBeenCalledWith('blob:owned');
});
