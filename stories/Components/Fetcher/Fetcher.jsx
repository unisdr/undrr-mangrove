import { h } from "preact";
import { useState, useEffect } from "preact/hooks";

const RESPONSE_PARAMS = {
  loading: false,
  data: [] || {},
};

export const generateQueryParams = (params) => {
  const urlSearchParams = new URLSearchParams();

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      urlSearchParams.append(key, params[key]);
    }
  }

  return urlSearchParams.toString();
};

const Fetcher = ({ api, render, queryParams = {}, username, password }) => {
  const [response, setResponse] = useState(RESPONSE_PARAMS);

  useEffect(() => {
    // Call the function
    fetchData().catch((err) => console.error(err));

    // Cleanup function to cancel any future setResponse
    return () => setResponse(RESPONSE_PARAMS);
  }, [api, JSON.stringify(queryParams)]);

  const fetchData = async () => {
    // Set state to loading
    setResponse((prevState) => ({
      ...prevState,
      loading: true,
    }));

    const queryString = generateQueryParams(queryParams);
    const API = `${api}?${queryString}`;

    try {
      // Create the request options with the Authorization header
      const response = await fetch(API, {
        method: "GET",
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Convert data to JSON
      const data = await response.json();

      console.log("DATA", data.results);

      // Set state with fetched data
      setResponse((prevState) => ({
        ...prevState,
        loading: false,
        data: data.results,
      }));
    } catch (error) {
      console.error("Fetch error: ", error);
      setResponse((prevState) => ({
        ...prevState,
        loading: false,
        data: [],
      }));
    }
  };

  return <div>{render(response)}</div>;
};

export default Fetcher;
