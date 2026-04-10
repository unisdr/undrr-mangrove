// TODO: Layered hydration (.fromElement.js + .hydrate.js) not yet adopted for
// this component. See docs/HYDRATION.md for the pattern.
import React from 'react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const RESPONSE_PARAMS = {
  isLoading: false,
  data: [] || {},
};

export const generateQueryParams = params => {
  const urlSearchParams = new URLSearchParams();

  for (const key in params) {
    if (
      params.hasOwnProperty(key) &&
      params[key] !== undefined &&
      params[key] !== null
    ) {
      urlSearchParams.append(key, params[key]);
    }
  }

  return urlSearchParams.toString();
};

/**
 * Generic data fetcher that retrieves JSON from an API endpoint and passes the
 * response to a render prop. Supports optional query parameters and basic
 * authentication credentials.
 *
 * @param {Object} props
 * @param {string} props.api              API endpoint URL to fetch data from.
 * @param {Function} props.render         Render prop receiving { isLoading, data }.
 * @param {Object} [props.queryParams={}] Key-value pairs appended as URL query parameters.
 * @param {string} [props.username]       Username for basic authentication (currently unused).
 * @param {string} [props.password]       Password for basic authentication (currently unused).
 */
const Fetcher = ({ api, render, queryParams = {}, username, password }) => {
  const [response, setResponse] = useState(RESPONSE_PARAMS);

  useEffect(() => {
    // Call the function
    fetchData().catch(err => console.error(err));

    // Cleanup function to cancel any future setResponse
    return () => setResponse(RESPONSE_PARAMS);
  }, [api, JSON.stringify(queryParams)]);

  const fetchData = async () => {
    // Set state to isLoading
    setResponse(prevState => ({
      ...prevState,
      isLoading: true,
    }));

    const queryString = generateQueryParams(queryParams);
    const API = queryString ? `${api}?${queryString}` : api;

    try {
      // Create the request options with the Authorization header
      const response = await fetch(API, {
        method: 'GET',
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Convert data to JSON
      const data = await response.json();

      // Set state with fetched data
      setResponse(prevState => ({
        ...prevState,
        isLoading: false,
        data: data.results,
      }));
    } catch (error) {
      console.error('Fetch error: ', error);
      setResponse(prevState => ({
        ...prevState,
        isLoading: false,
        data: [],
      }));
    }
  };

  return <div>{render(response)}</div>;
};

Fetcher.propTypes = {
  /** API endpoint URL to fetch data from. */
  api: PropTypes.string.isRequired,
  /** Render prop receiving { isLoading, data } response object. */
  render: PropTypes.func.isRequired,
  /** Key-value pairs appended as URL query parameters. */
  queryParams: PropTypes.object,
  /** Username for basic authentication. */
  username: PropTypes.string,
  /** Password for basic authentication. */
  password: PropTypes.string,
};

export default Fetcher;
