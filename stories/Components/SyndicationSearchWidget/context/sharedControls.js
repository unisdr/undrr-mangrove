import { FACET_FIELDS, isFilterVisible } from '../utils/constants';
import { facetsFromDefaults } from '../utils/hashState';
import { isTabFacet } from '../utils/customFacetTabs';

// A page owns its groups. Separate editor documents and iframes never exchange state.
const documents = new WeakMap();
const emptySnapshot = null;
export const emptySharedStore = {
  subscribe: () => () => {},
  getSnapshot: () => emptySnapshot,
};

export function sharedKeys(config) {
  return new Set(
    (config.facetFields || FACET_FIELDS)
      .filter(field =>
        isFilterVisible(field.key, config.sharedControls.visibleFilters)
      )
      .map(field => field.key)
  );
}

export function withSharedControls(config) {
  if (!config.sharedControls?.id) return config;
  const shared = config.sharedControls;
  const keys = sharedKeys(config);
  return {
    ...config,
    enableHashSync: false,
    ssrResults: undefined,
    defaultQuery: shared.defaultQuery || '',
    visibleFilters: shared.visibleFilters ?? null,
    allowedTypes: shared.allowedTypes ?? null,
    customFacets: [
      ...(config.customFacets || []).filter(isTabFacet),
      ...(shared.customFacets || []).filter(facet => !isTabFacet(facet)),
    ],
    defaultFilters: [
      ...(config.defaultFilters || []).filter(filter => !keys.has(filter.key)),
      ...(shared.defaultFilters || []).filter(filter => keys.has(filter.key)),
    ],
  };
}

function unionAggregations(members) {
  const fields = new Map();
  for (const aggregates of members.values()) {
    for (const [field, aggregate] of Object.entries(aggregates || {})) {
      if (!fields.has(field)) fields.set(field, new Map());
      for (const bucket of aggregate.buckets || []) {
        const { doc_count: ignored, ...option } = bucket;
        fields.get(field).set(String(bucket.key), option);
      }
    }
  }
  return Object.fromEntries(
    [...fields].map(([field, buckets]) => [
      field,
      { buckets: [...buckets.values()] },
    ])
  );
}

export function getSharedStore(document, config) {
  if (!document || !config.sharedControls?.id) return emptySharedStore;
  if (!documents.has(document)) documents.set(document, new Map());
  const groups = documents.get(document);
  const id = config.sharedControls.id;
  if (groups.has(id)) return groups.get(id);
  const listeners = new Set();
  const members = new Map();
  let definition = config;
  let definitionKey = JSON.stringify(config.sharedControls);
  const baseline = () =>
    Object.fromEntries(
      Object.entries(
        facetsFromDefaults(definition.sharedControls.defaultFilters)
      ).filter(([key]) => sharedKeys(definition).has(key))
    );
  let snapshot = {
    query: config.sharedControls.defaultQuery || '',
    facets: baseline(),
    facetOperators: {},
    customFacets: {},
    queryIsTyped: false,
    revision: 0,
    aggregations: {},
  };
  const emit = next => {
    snapshot = next;
    for (const listener of listeners) listener();
  };
  const store = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    configure(nextConfig) {
      const key = JSON.stringify(nextConfig.sharedControls);
      if (key === definitionKey) return;
      const previousDefaults = baseline();
      const previousQuery = definition.sharedControls.defaultQuery || '';
      definition = nextConfig;
      definitionKey = key;
      const keys = sharedKeys(definition);
      const keep = values =>
        Object.fromEntries(
          Object.entries(values).filter(([name]) => keys.has(name))
        );
      const defaults = baseline();
      const facets = keep(snapshot.facets);
      for (const name of keys) {
        if (
          JSON.stringify(snapshot.facets[name] || []) ===
          JSON.stringify(previousDefaults[name] || [])
        ) {
          if (defaults[name]) facets[name] = defaults[name];
          else delete facets[name];
        }
      }
      const customIds = new Set(
        (definition.sharedControls.customFacets || [])
          .filter(facet => !isTabFacet(facet))
          .map(facet => facet.id)
      );
      emit({
        ...snapshot,
        query:
          snapshot.query === previousQuery
            ? definition.sharedControls.defaultQuery || ''
            : snapshot.query,
        queryIsTyped: false,
        customFacets: Object.fromEntries(
          Object.entries(snapshot.customFacets).filter(([name]) =>
            customIds.has(name)
          )
        ),
        facets,
        facetOperators: keep(snapshot.facetOperators),
        revision: snapshot.revision + 1,
      });
    },
    dispatch(action) {
      const payload = action.payload;

      const keys = sharedKeys(definition);
      const customIds = new Set(
        (definition.sharedControls.customFacets || [])
          .filter(facet => !isTabFacet(facet))
          .map(facet => facet.id)
      );
      let next = { ...snapshot, queryIsTyped: false };
      switch (action.type) {
        case 'SET_QUERY':
          if (payload === snapshot.query) return true;
          next.query = payload;
          next.queryIsTyped = !action.immediate;
          break;
        case 'SET_FACET': {
          if (!keys.has(payload.key)) return false;
          const values = Array.isArray(payload.value)
            ? payload.value
            : [payload.value];
          next.facets = {
            ...snapshot.facets,
            [payload.key]:
              payload.replace === false
                ? [
                    ...new Set([
                      ...(snapshot.facets[payload.key] || []),
                      ...values,
                    ]),
                  ]
                : values,
          };
          break;
        }
        case 'REMOVE_FACET': {
          if (!keys.has(payload.key)) return false;
          next.facets = { ...snapshot.facets };
          next.facetOperators = { ...snapshot.facetOperators };
          if (payload.value === undefined) delete next.facets[payload.key];
          else
            next.facets[payload.key] = (next.facets[payload.key] || []).filter(
              value => value !== payload.value
            );
          if (!next.facets[payload.key]?.length)
            delete next.facetOperators[payload.key];
          break;
        }
        case 'SET_FACET_OPERATOR':
          if (!keys.has(payload.key)) return false;
          next.facetOperators = {
            ...snapshot.facetOperators,
            [payload.key]: payload.operator,
          };
          break;
        case 'SET_CUSTOM_FACET':
          if (!customIds.has(payload.facetId)) return false;
          next.customFacets = {
            ...snapshot.customFacets,
            [payload.facetId]: Array.isArray(payload.value)
              ? payload.value
              : [payload.value],
          };
          break;
        case 'REMOVE_CUSTOM_FACET':
          if (!customIds.has(payload.facetId)) return false;
          next.customFacets = { ...snapshot.customFacets };
          delete next.customFacets[payload.facetId];
          break;
        case 'CLEAR_FACETS':
          next.facets = baseline();
          next.facetOperators = {};
          next.customFacets = {};
          break;
        default:
          return false;
      }
      emit({ ...next, revision: snapshot.revision + 1 });
      return true;
    },
    report(member, aggregations) {
      if (members.get(member) === aggregations) return;
      members.set(member, aggregations);
      emit({ ...snapshot, aggregations: unionAggregations(members) });
    },
    remove(member) {
      if (!members.delete(member)) return;
      emit({ ...snapshot, aggregations: unionAggregations(members) });
    },
  };
  groups.set(id, store);
  return store;
}
