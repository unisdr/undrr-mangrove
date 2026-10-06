var isLocalDevelopment = isLocalDevelopment || location.hostname.includes(".ddev.site");
var _widget_url = isLocalDevelopment ? "https://widget.ddev.site" : "https://publish.preventionweb.net";

/**
 * Resolves the correct domain for the current environment
 * Maps production domains to their corresponding ddev development domains when in local development
 * @param {string} _content_domain - The production domain to resolve
 * @returns {string} The resolved domain with https:// prefix
 */
function getDomainForEnv(_content_domain) {
  let _active_hostname = _content_domain;

  // if we're on local dev, look up the corresponding ddev domain
  if (location.hostname.match(".ddev.site")) {
    const ddevDomains = {
      "www.preventionweb.net": "preventionweb.ddev.site",
      "www.undrr.org": "undrr.ddev.site",
    };

    for (const key in ddevDomains) {
      if (_active_hostname === key) {
        _active_hostname = ddevDomains[key];
        break;
      }
    }
  }

  _active_hostname = "https://" + _active_hostname;
  return _active_hostname;
}

/**
 * Applies a base URL to relative links, images, and CSS background images in HTML content
 * Preserves absolute URLs, protocol-relative URLs, and data URLs
 * @param {string} html - The HTML content to process
 * @param {string} baseUrl - The base URL to prepend to relative paths
 * @returns {string} The processed HTML with absolute URLs
 */
function applyBaseUrl(html, baseUrl) {
  // Regular expressions to match non-prefixed links and images
  const linkRegex = /(?:href=['"])(?!https?:\/\/|\/\/|#)([^'"]+?)/gi;
  const imgRegex = /(?:src=['"])(?!https?:\/\/|\/\/|data:)([^'"]+?)/gi;
  const bgImageRegex = /(?:background-image:url\(['"]?)(?!https?:\/\/|\/\/|data:)([^'")]+?)/gi;

  // Replace non-prefixed links with base URL
  html = html.replace(linkRegex, (match, link) => {
    return match.replace(link, `${baseUrl}${link}`);
  });

  // Replace non-prefixed images with base URL
  html = html.replace(imgRegex, (match, img) => {
    return match.replace(img, `${baseUrl}${img}`);
  });

  // Replace non-prefixed css background images with base URL
  html = html.replace(bgImageRegex, (match, img) => {
    return match.replace(img, `${baseUrl}${img}`);
  });

  return html;
}

var PW_Widget = PW_Widget || {};

// Some quality of life developer feedback when widget.ddev.site is not running.
function reportNoLocalWidgetDdev() {
  console.warn("widget.ddev.site is not available, did you start it?");
}
if (isLocalDevelopment) {
  console.log("Local development detected: this will query against widget.ddev.site");
  fetch(`${_widget_url}/widget-body.php?contenttype=educational`)
    .then((response) => {
      if (response.status !== 200) {
        reportNoLocalWidgetDdev();
      }
    })
    .catch((error) => {
      reportNoLocalWidgetDdev();
    });
}

/**
 * Main PW_Widget namespace
 * @namespace PW_Widget
 */

/**
 * Initializes the PW_Widget with the provided configuration options
 * Sets up the widget container, loads templates, and triggers initial data fetch
 * @memberof PW_Widget
 * @param {Object} options - Configuration options for the widget
 * @param {string} options.contenttype - Type of content to display ('educational', 'publications', 'events', 'news', 'landingpage')
 * @param {boolean} [options.showpagination=false] - Whether to enable pagination
 * @param {string} [options.displaymode='list'] - Display mode ('list' or 'table')
 * @param {boolean} [options.showfilters=true] - Whether to show content filters
 * @param {string} [options.langcode='en'] - Language code for content
 * @param {boolean} [options.includemetatags=true] - Whether to include meta tags
 * @param {boolean} [options.includecss=true] - Whether to include CSS styles
 * @param {number} [options.maxrows=10] - Maximum number of items to display
 * @param {number} [options.pagesize=10] - Number of items per page
 * @param {string} [options.pageid] - Page ID for landingpage content type
 * @param {string} [options.activedomain] - Override the default domain
 * @param {string} [options.suffixID] - Custom suffix for widget container ID
 * @param {string} [options.template] - Custom template override
 */
PW_Widget.initialize = function (options) {
  var _content_type = "";
  var _content_pageid = "";
  var _content_display_mode = "list";
  var _content_includeMetaTags = true;
  var _content_includeCSS = true;
  var _content_langcode = "en";
  var _content_filters = true;
  var _content_showPagination = false;
  var _content_maxrows = 10;
  var _content_pagesize = 10;
  var _suffixID = ((Math.random() * 0xffffff) << 0).toString(16);

  if (!options) options = {};

  _content_type = options.contenttype;
  _content_showPagination = options.showpagination;
  _content_display_mode = options.displaymode;
  _content_filters = options.showfilters;
  var _content_domain = "www.preventionweb.net";

  if (typeof options.langcode !== "undefined") _content_langcode = options.langcode;
  if (typeof options.includemetatags !== "undefined") _content_includeMetaTags = options.includemetatags;
  if (typeof options.includecss !== "undefined") _content_includeCSS = options.includecss;
  if (typeof options.maxrows !== "undefined") _content_maxrows = options.maxrows;
  if (typeof options.pagesize !== "undefined") _content_pagesize = options.pagesize;
  if (typeof options.pageid !== "undefined" && options.pageid != "") _content_pageid = options.pageid;
  if (typeof options.activedomain !== "undefined") _content_domain = options.activedomain;

  if (_content_type == "landingpage") {
    _content_filters = false;
    _content_showPagination = false;
  }

  if (_content_showPagination !== false) {
    var script3 = document.createElement("script");
    script3.type = "text/javascript";
    script3.src = "https://publish.preventionweb.net/purePajinate.es5.min.js";
    document.head.appendChild(script3);
  }

  if (typeof options.suffixID !== "undefined") _suffixID = options.suffixID;
  else options.suffixID = _suffixID;

  // See if there is a <div class="pw-widget-3d797b">
  var containerDiv = document.getElementsByClassName("pw-widget-" + _suffixID);
  // console.log('containerDiv', containerDiv.length);

  // If there is no specified container to embed in, fallback to placing it at the end of the document.
  if (containerDiv.length === 0) {
    containerDiv = document.createElement("div");
    document.body.appendChild(containerDiv);
  } else {
    containerDiv = containerDiv[0];
  }
  containerDiv.id = "PW_Widget_Container_" + _suffixID;
  containerDiv.classList.add("pw-widget-container");

  var widgetBodyURL = _widget_url + "/widget-body.php?contenttype=" + _content_type + "&includecss=" + _content_includeCSS;

  if (_content_type != "landingpage") {
    widgetBodyURL += "&displaymode=" + _content_display_mode + "&showfilters=" + _content_filters + "&showpagination=" + _content_showPagination;
  }

  fetch(widgetBodyURL)
    .then((response) => {
      return response.text();
    })
    .then((data) => {
      if (typeof bootstrap == "object") {
        data = data.replace('<link rel="stylesheet" media="all" href="//getbootstrap.com/docs/3.4/dist/css/bootstrap.min.css" />', "");
      }

      document.getElementById("PW_Widget_Container_" + _suffixID).innerHTML =
        data + '<div id="PW_Widget_Content_' + _suffixID + '"></div>' + '<div id="PW_Widget_Pagination_' + _suffixID + '" class="widget_pagination"></div>';
      document.getElementById("PW_Widget_Container_" + _suffixID).dataset.options = JSON.stringify(options);
      document.getElementById("PW_Widget_Container_" + _suffixID).dataset.suffixID = _suffixID;

      document.getElementById("PW_Widget_Content_" + _suffixID).innerHTML = '<img src="' + _widget_url + '/loader.gif" border="0" style="margin-left:45%; margin-top:50px; height:60px !important;" />';
      if (_content_filters !== false && _content_filters !== "false") PW_Widget.populate_filters();
      PW_Widget.get_data(options);
    });
};

/**
 * Fetches content data from the API and renders it using the appropriate template
 * Handles filtering, pagination, and meta tag injection
 * @memberof PW_Widget
 * @param {Object} [options] - Widget options (uses stored options if not provided)
 */
PW_Widget.get_data = function (options) {
  if (typeof options === "undefined") options = JSON.parse(document.querySelector("div[id^=PW_Widget_Container]").dataset.options);

  var _content_tmplt = "";
  var _content_display_mode = options.displaymode;
  var _content_type = options.contenttype;

  if (typeof options.template !== "undefined") _content_tmplt = options.template;
  else {
    if (_content_type == "landingpage") _content_tmplt = document.querySelector("#PW_Widget_Template_" + _content_type).innerHTML;
    else _content_tmplt = document.querySelector("#PW_Widget_Template_" + _content_type + "_" + _content_display_mode).innerHTML;
  }

  if (typeof options.langcode === "undefined") options.langcode = "en";
  var _content_langcode = options.langcode;

  var _content_includeMetaTags = options.includemetatags;
  var _content_domain = "www.preventionweb.net";
  var _content_includeCSS = options.includecss;
  var _content_showPagination = options.showpagination;
  var _content_display_mode = options.displaymode;
  var _content_filters = options.showfilters;
  if (typeof options.maxrows !== "undefined") var _content_maxrows = options.maxrows;
  if (typeof options.pagesize !== "undefined") var _content_pagesize = options.pagesize;
  if (typeof options.pageid !== "undefined" && options.pageid != "") var _content_pageid = options.pageid;
  if (typeof options.activedomain !== "undefined") _content_domain = options.activedomain;

  if (_content_type == "landingpage") {
    console.log("UNDRR Widget syndication: Please use the optimised landing page loader at https://publish.preventionweb.net/widget-landingpage.js");
    _content_filters = false;
    _content_showPagination = false;
  }

  var _active_hostname = getDomainForEnv(_content_domain);
  var _suffixID = options.suffixID;

  document.querySelector("#PW_Widget_Content_" + _suffixID).innerHTML = '<img src="' + _widget_url + '/loader.gif" border="0" style="margin-left:45%; margin-top:50px; height:60px !important;" />';

  if (_content_type == "landingpage") var api_url = _active_hostname + "/api/v2/content/" + _content_type + "?id=" + _content_pageid + "&suffixid=" + _suffixID;
  else var api_url = _active_hostname + "/api/v2/content/" + _content_type + "?items_per_page=" + _content_maxrows + "&sortby=ent_datepublished&sortorder=DESC&suffixid=" + _suffixID;

  api_url += "&langcode=" + _content_langcode;

  if (_content_filters == true || _content_filters == "true") api_url += PW_Widget.process_filters();

  fetch(api_url)
    .then((response) => response.json())
    .then((data) => {
      if (data.results.length == 0) {
        document.querySelector("#PW_Widget_Content_" + _suffixID).innerHTML = "<p>No records found.</p>";
      } else {
        _suffixID = PW_Widget.urlParam("suffixid", api_url);

        // Format date fields before templating
        data.results.forEach(function (item) {
          if (item.published_on) item.published_on = PW_Widget.formatDate(item.published_on);
        });

        var template = _content_tmplt;
        var htmlResponse = microHandlebars(template, data.results);

        document.querySelector("#PW_Widget_Content_" + _suffixID).innerHTML = applyBaseUrl(htmlResponse, _active_hostname);

        if (document.querySelector("#PW_Widget_Pagination_" + _suffixID) && (_content_showPagination == "true" || _content_showPagination == true)) {
          var widgetPagination = new purePajinate({
            containerSelector: "#PW_Widget_Content_" + _suffixID + " div.view-content",
            itemSelector: "#PW_Widget_Content_" + _suffixID + " div.view-content > article",
            navigationSelector: "#PW_Widget_Pagination_" + _suffixID,
            itemsPerPage: _content_pagesize,
            showFirstLast: true,
          });

          document.querySelector("#PW_Widget_Pagination_" + _suffixID).style.display = "block";
        } else {
          document.querySelector("#PW_Widget_Pagination_" + _suffixID).style.display = "none";
        }

        if (_content_includeMetaTags == true || _content_includeMetaTags == "true") {
          fetch(_active_hostname + "/api/v2/content/entity?id=" + _content_pageid)
            .then((response) => response.json())
            .then((dataEntity) => {
              if (dataEntity.results.length > 0) {
                var metatags = dataEntity.results[0].metatag;
                var documentMetas = document.getElementsByTagName("meta");

                for (var i = 0; i < metatags.length; ++i) {
                  var meta = metatags[i];

                  if (meta.tag == "meta" && meta.attributes["name"] != "title") {
                    var metaAttrStr = "";
                    if (meta.attributes["name"] != undefined) metaAttrStr = "name";
                    else if (meta.attributes["property"] != undefined) metaAttrStr = "property";

                    // Check if metatag exist in the document, else create it
                    var found = false;
                    for (var m = 0; m < documentMetas.length; ++m) {
                      var docMeta = documentMetas[m];

                      if (metaAttrStr != "" && docMeta.getAttribute(metaAttrStr) === meta.attributes[metaAttrStr]) {
                        found = true;
                        break;
                      }
                    }

                    if (found == false) {
                      var newMeta = document.createElement("meta");
                      newMeta.setAttribute(metaAttrStr, meta.attributes[metaAttrStr]);
                      newMeta.content = meta.attributes["content"];
                      document.getElementsByTagName("head")[0].appendChild(newMeta);
                    }
                  }
                }
              }
            });
        }
      }
    });
};

/**
 * Processes the current filter selections and builds API query parameters
 * @memberof PW_Widget
 * @returns {string} URL query parameters for the selected filters
 */
PW_Widget.process_filters = function () {
  var api_url = "";
  var filters = ["theme", "hazard", "region", "country"];

  filters.forEach(function (item, index, array) {
    var selectedOption = document.querySelector("select[name=filter_" + item + "] option:checked");
    if (selectedOption && selectedOption.value != "" && selectedOption.value != "undefined") {
      api_url += "&" + item + "=" + selectedOption.value;
    }
  });

  return api_url;
};

/**
 * Formats an ISO date string into a human-readable local date (e.g. "14 Jan 2026")
 * @memberof PW_Widget
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string} Formatted date or the original string if parsing fails
 */
PW_Widget.formatDate = function (dateStr) {
  if (!dateStr) return "";
  var date = new Date(dateStr.trim());
  if (isNaN(date.getTime())) return dateStr;
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
};

/**
 * Fetches taxonomy data client-side and populates the filter dropdowns.
 * This replaces the previous server-side PHP file_get_contents() approach
 * which was blocked by Cloudflare's bot protection on server-to-server requests.
 * @memberof PW_Widget
 */
PW_Widget.populate_filters = function () {
  var taxonomies = [
    { endpoint: "themes", selectId: "filter_theme" },
    { endpoint: "hazards", selectId: "filter_hazard" },
    { endpoint: "regions", selectId: "filter_region", attr: "region", attrField: "name" },
    { endpoint: "countries", selectId: "filter_country", attr: "region", attrField: "region" },
  ];

  var fetches = [];
  taxonomies.forEach(function (tax) {
    var select = document.getElementById(tax.selectId);
    if (!select) return;

    fetches.push(
      fetch("https://www.preventionweb.net/api/v2/taxonomy/" + tax.endpoint + "?utm_source=pw_widget&utm_medium=client_js&utm_campaign=filter_populate")
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (!data || !data.results) return;
          data.results.forEach(function (item) {
            var option = document.createElement("option");
            option.value = item.tid;
            option.textContent = item.name;
            if (tax.attr && tax.attrField) {
              option.setAttribute(tax.attr, item[tax.attrField]);
            }
            select.appendChild(option);
          });
        })
        .catch(function () {
          // Silently fail if taxonomy API is unavailable
        })
    );
  });

  return Promise.all(fetches);
};

/**
 * Extracts a URL parameter value from a given URL string
 * @memberof PW_Widget
 * @param {string} name - The parameter name to extract
 * @param {string} url - The URL string to parse
 * @returns {string|null} The parameter value or null if not found
 */
PW_Widget.urlParam = function getUrlParameter(name, url) {
  var results = new RegExp("[?&]" + name + "=([^&#]*)").exec(url);
  if (results == null) {
    return null;
  }
  return decodeURIComponent(results[1]) || 0;
};

function applyFilter() {
  document.getElementById("filter_reset").classList.add("hide");
  PW_Widget.get_data();

  if (
    document.getElementById("filter_theme").selectedIndex > 0 ||
    document.getElementById("filter_hazard").selectedIndex > 0 ||
    document.getElementById("filter_region").selectedIndex > 0 ||
    document.getElementById("filter_country").selectedIndex > 0
  )
    document.getElementById("filter_reset").classList.remove("hide");
}

function resetFilter() {
  document.getElementById("filter_theme").selectedIndex = 0;
  document.getElementById("filter_hazard").selectedIndex = 0;
  document.getElementById("filter_region").selectedIndex = 0;
  document.getElementById("filter_country").selectedIndex = 0;
  PW_Widget.get_data();
  document.getElementById("filter_reset").classList.add("hide");
}

function regionFilter(objRegion) {
  const $filterCountry = document.querySelector("#filter_country");

  for (let i = 1; i <= $filterCountry.options.length - 1; i++) {
    $filterCountry[i].style.display = "block";
  }

  if (objRegion.value !== "") {
    var RegionName = objRegion.options[objRegion.selectedIndex].getAttribute("region");

    for (let i = 1; i <= $filterCountry.options.length - 1; i++) {
      if ($filterCountry[i].getAttribute("region") !== RegionName) $filterCountry[i].style.display = "none";
    }
  }

  $filterCountry.selectedIndex = 0;
}

/**
 * A lightweight Handlebars-like template engine that processes templates with mustache-style syntax.
 * Supports variable interpolation, conditionals, and iterating over arrays and objects.
 *
 * @param {string} template - The template string containing Handlebars-like syntax ({{variable}}, {{#if}}, etc.)
 * @param {Object|Array} data - The data object or array to use for template variable substitution
 * @returns {string} The processed template with all variables and expressions replaced with their values
 *
 * @example const compiled = (data) => microHandlebars(templateString, data);
 */
function microHandlebars(template, data, scope) {
  scope = scope || "";

  // Extract the first property name from scope if it exists
  if (scope) {
    const match = scope.match(/{{#([^}]+)}}/);
    if (match) {
      scope = match[1];
    }
  }

  // If no data or empty array, return empty string
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return "";
  }

  // Handle arrays - check for block helpers first, then handle simple array iteration
  if (Array.isArray(data)) {
    // Check if template has block helpers - if so, let them handle the iteration
    const hasBlockHelpers = /{{#[^}]+}}/.test(template);

    if (!hasBlockHelpers) {
      // No block helpers found - treat as simple array iteration
      return data.map((item) => microHandlebars(template, item)).join("");
    }
    // If block helpers exist, continue with normal processing
  }

  // Replace {{#propertyName}}content{{/propertyName}} (block helpers)
  template = template.replace(/{{#([^}]+)}}(.*?){{\/\1}}/gs, (match, prop, content) => {
    if (prop === ".") {
      // This handles the {{#.}}...{{/.}} case for the current context
      if (Array.isArray(data)) {
        return data.map((item) => microHandlebars(content, item, match)).join("");
      } else {
        return microHandlebars(content, data, match);
      }
    }

    if (!data[prop]) {
      return ""; // Property doesn't exist
    }

    if (Array.isArray(data[prop])) {
      return data[prop].map((item) => microHandlebars(content, item, match)).join("");
    }

    if (typeof data[prop] === "object") {
      return microHandlebars(content, data[prop], match);
    }

    // For simple values, just return the content if the property is truthy
    return data[prop] ? microHandlebars(content, data, match) : "";
  });

    // Replace {{#if condition}}content{{else}}alternative{{/if}}
  // This must come AFTER block helpers to ensure proper data context
  // Function to find matching {{/if}} for a given {{#if}}
  function findMatchingIfEnd(str, startPos) {
    let depth = 1;
    let pos = startPos;
    while (pos < str.length && depth > 0) {
      const ifMatch = str.indexOf('{{#if', pos);
      const endMatch = str.indexOf('{{/if}}', pos);

      if (endMatch === -1) break;

      if (ifMatch !== -1 && ifMatch < endMatch) {
        depth++;
        pos = ifMatch + 5;
      } else {
        depth--;
        if (depth === 0) return endMatch;
        pos = endMatch + 7;
      }
    }
    return -1;
  }

  // Process if statements from innermost to outermost
  while (template.includes('{{#if ')) {
    let found = false;
    let pos = 0;

    while ((pos = template.indexOf('{{#if ', pos)) !== -1) {
      const conditionEnd = template.indexOf('}}', pos);
      if (conditionEnd === -1) break;

      const condition = template.substring(pos + 6, conditionEnd).trim();
      const contentStart = conditionEnd + 2;
      const ifEnd = findMatchingIfEnd(template, contentStart);

      if (ifEnd === -1) break;

      const fullContent = template.substring(contentStart, ifEnd);
      const elsePos = fullContent.lastIndexOf('{{else}}');

      let result;
      if (elsePos !== -1) {
        const ifContent = fullContent.substring(0, elsePos);
        const elseContent = fullContent.substring(elsePos + 8);
        result = data[condition] ? microHandlebars(ifContent, data) : microHandlebars(elseContent, data);
      } else {
        result = data[condition] ? microHandlebars(fullContent, data) : '';
      }

      template = template.substring(0, pos) + result + template.substring(ifEnd + 7);
      found = true;
      break; // Start over to handle nested structures properly
    }

    if (!found) break;
  }

  // Replace {{{propertyName}}} (unescaped HTML)
  template = template.replace(/{{{([^}]+)}}}/g, (match, prop) => {
    if (prop === ".") return data[scope];
    // Don't process array properties in variable replacement - they should use block helpers
    if (Array.isArray(data[prop])) {
      return "";
    }
    return data[prop] !== undefined ? data[prop] : "";
  });

  // Replace simple {{propertyName}}
  template = template.replace(/{{([^}]+)}}/g, (match, prop) => {
    if (prop === ".") return data[scope];
    // Don't process array properties in variable replacement - they should use block helpers
    if (Array.isArray(data[prop])) {
      return "";
    }
    return data[prop] !== undefined ? data[prop] : "";
  });

  return template;
}
