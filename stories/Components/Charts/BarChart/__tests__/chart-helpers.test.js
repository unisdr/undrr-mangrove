import { transformDataForBarChart } from '../chart-helpers';

describe('transformDataForBarChart', () => {
  // --------------------------------------------------
  // Pass-through when apiData is not 'true'
  // --------------------------------------------------

  it('returns input data unchanged when apiData is not "true"', () => {
    const input = [{ label: '2020', value: 5, color: '#000' }];
    const result = transformDataForBarChart(input, { apiData: false });
    expect(result).toBe(input);
  });

  it('returns input data unchanged when apiData is omitted', () => {
    const input = [{ label: '2021', value: 10, color: '#fff' }];
    const result = transformDataForBarChart(input);
    expect(result).toBe(input);
  });

  // --------------------------------------------------
  // COMMITMENTS graph type
  // --------------------------------------------------

  it('counts commitments per year', () => {
    const results = [
      { node_id: 1, created_on: '2020-01-15' },
      { node_id: 2, created_on: '2020-06-01' },
      { node_id: 3, created_on: '2021-03-10' },
    ];

    const output = transformDataForBarChart(results, {
      apiData: 'true',
      startYear: 2020,
      endYear: 2022,
      graphType: 'COMMITMENTS',
    });

    expect(output).toEqual([
      { label: '2020', value: 2, color: '#007bc8' },
      { label: '2021', value: 1, color: '#007bc8' },
      { label: '2022', value: 0, color: '#007bc8' },
    ]);
  });

  it('deduplicates by node_id for COMMITMENTS', () => {
    const results = [
      { node_id: 1, created_on: '2020-01-15' },
      { node_id: 1, created_on: '2020-06-01' }, // duplicate
    ];

    const output = transformDataForBarChart(results, {
      apiData: 'true',
      startYear: 2020,
      endYear: 2020,
      graphType: 'COMMITMENTS',
    });

    expect(output).toEqual([{ label: '2020', value: 1, color: '#007bc8' }]);
  });

  // --------------------------------------------------
  // Cumulative mode
  // --------------------------------------------------

  it('produces cumulative counts when cumulative is true', () => {
    const results = [
      { node_id: 1, created_on: '2020-01-15' },
      { node_id: 2, created_on: '2020-06-01' },
      { node_id: 3, created_on: '2021-03-10' },
    ];

    const output = transformDataForBarChart(results, {
      apiData: 'true',
      startYear: 2020,
      endYear: 2022,
      graphType: 'COMMITMENTS',
      cumulative: true,
    });

    expect(output[0].value).toBe(2); // 2020: 2
    expect(output[1].value).toBe(3); // 2021: 2 + 1
    expect(output[2].value).toBe(3); // 2022: 3 + 0
  });

  // --------------------------------------------------
  // Custom color
  // --------------------------------------------------

  it('uses the provided defaultColor', () => {
    const results = [{ node_id: 1, created_on: '2020-01-01' }];

    const output = transformDataForBarChart(results, {
      apiData: 'true',
      startYear: 2020,
      endYear: 2020,
      graphType: 'COMMITMENTS',
      defaultColor: '#ff0000',
    });

    expect(output[0].color).toBe('#ff0000');
  });

  // --------------------------------------------------
  // DELIVERABLES graph type
  // --------------------------------------------------

  it('counts unique deliverables', () => {
    const results = [
      { node_id: 1, created_on: '2020-01-01', deliverable_id: 'a' },
      { node_id: 1, created_on: '2020-06-01', deliverable_id: 'b' },
      { node_id: 1, created_on: '2020-06-01', deliverable_id: 'a' }, // duplicate
    ];

    const output = transformDataForBarChart(results, {
      apiData: 'true',
      startYear: 2020,
      endYear: 2020,
      graphType: 'DELIVERABLES',
    });

    expect(output[0].value).toBe(2);
  });

  // --------------------------------------------------
  // ORGANIZATIONS graph type
  // --------------------------------------------------

  it('counts unique organizations and partners', () => {
    const results = [
      {
        node_id: 1,
        created_on: '2020-01-01',
        organizations: ['org1', 'org2'],
        partners: 'partner1, partner2',
      },
      {
        node_id: 2,
        created_on: '2020-06-01',
        organizations: ['org1'], // duplicate org
        partners: 'partner3',
      },
    ];

    const output = transformDataForBarChart(results, {
      apiData: 'true',
      startYear: 2020,
      endYear: 2020,
      graphType: 'ORGANIZATIONS',
    });

    // org1, org2, partner1, partner2 from first + partner3 from second = 5
    expect(output[0].value).toBe(5);
  });

  // --------------------------------------------------
  // Repeated calls don't leak state (bug fix verification)
  // --------------------------------------------------

  it('does not accumulate state across multiple calls', () => {
    const results1 = [
      {
        node_id: 1,
        created_on: '2020-01-01',
        organizations: ['org1'],
        partners: 'partner1',
      },
    ];

    const output1 = transformDataForBarChart([...results1], {
      apiData: 'true',
      startYear: 2020,
      endYear: 2020,
      graphType: 'ORGANIZATIONS',
    });

    const results2 = [
      {
        node_id: 2,
        created_on: '2020-01-01',
        organizations: ['org1'], // same org as first call
        partners: 'partner1', // same partner as first call
      },
    ];

    const output2 = transformDataForBarChart([...results2], {
      apiData: 'true',
      startYear: 2020,
      endYear: 2020,
      graphType: 'ORGANIZATIONS',
    });

    // Both calls should count independently
    expect(output1[0].value).toBe(output2[0].value);
  });

  // --------------------------------------------------
  // Invalid graph type
  // --------------------------------------------------

  it('returns false for invalid graphType', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const results = [{ node_id: 1, created_on: '2020-01-01' }];

    const output = transformDataForBarChart(results, {
      apiData: 'true',
      graphType: 'INVALID',
    });

    expect(output).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid graphType passed to mg-bar-chart',
      'INVALID',
    );
    consoleSpy.mockRestore();
  });

  // --------------------------------------------------
  // Year range
  // --------------------------------------------------

  it('generates entries for the full year range', () => {
    const results = [];

    const output = transformDataForBarChart(results, {
      apiData: 'true',
      startYear: 2015,
      endYear: 2020,
      graphType: 'COMMITMENTS',
    });

    expect(output).toHaveLength(6);
    expect(output[0].label).toBe('2015');
    expect(output[5].label).toBe('2020');
  });
});
