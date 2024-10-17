import React, { useEffect, useRef } from "react";
import { mgTableOfContents } from "./js/toc";

export default function TableOfContents({ tocData, showNumbers = false }) {
  const ListComponent = showNumbers ? "ol" : "ul";

  const contentRef = useRef(null);
  const tocRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && tocRef.current) {
      mgTableOfContents(contentRef.current, ".mg-table-of-contents");
    }
  }, []);

  return (
    <section className="mg-table-of-contents">
      <h2>On this page</h2>
      <ListComponent>
        {tocData.map((item, index) => (
          <li key={index}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ListComponent>
    </section>
  );
}

TableOfContents.defaultParameters = {
  tocData: [],
  showNumbers: false,
};
