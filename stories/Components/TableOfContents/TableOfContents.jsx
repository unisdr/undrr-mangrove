import React, { useEffect, useRef } from "react";
import { mgTableOfContents } from "./js/TableOfContentsVanillaJs";

export default function TableOfContents({ tocData, showNumbers = false }) {
  const ListComponent = showNumbers ? "ol" : "ul";

  const contentRef = useRef(null);
  const tocRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && tocRef.current) {
      mgTableOfContents(contentRef.current, tocRef.current);
    }
  }, []);

  return (
    <div ref={contentRef}>
      <section data-mg-table-of-contents data-mg-table-of-contents-title="Title name can be optionally passed" className="mg-table-of-contents" ref={tocRef}>
        <ListComponent>
          {tocData.map((item, index) => (
            <li key={index}>
             <a href={`#${item.id}`}>{item.text}</a>
            </li>
          ))}
        </ListComponent>
      </section>
    </div>
  );
}

TableOfContents.defaultParameters = {
  tocData: [],
  showNumbers: false,
};
