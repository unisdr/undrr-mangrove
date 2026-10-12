import React, { useEffect, useRef } from 'react';
import ShareButtons from '../../Components/Buttons/ShareButtons/ShareButtons';
import { mgCiteThis, mgCiteThisDestroy } from '../../assets/js/cite-this';

const work = {
  author: 'United Nations Office for Disaster Risk Reduction',
  publisher: 'UNDRR',
  year: '2025',
  title: 'Hazard Information Profiles: 2025 version',
  type: 'report',
};

function CiteThis() {
  const ref = useRef(null);
  useEffect(() => {
    mgCiteThis(ref.current);
    return () => mgCiteThisDestroy(ref.current);
  }, []);
  return (
    <div
      ref={ref}
      className="mg-cite-this"
      data-mg-cite-this
      data-mg-cite-this-author={work.author}
      data-mg-cite-this-publisher={work.publisher}
      data-mg-cite-this-year={work.year}
      data-mg-cite-this-title={work.title}
      data-mg-cite-this-type={work.type}
      data-mg-cite-this-id="node/101"
    />
  );
}

/** Story-only composition of ShareButtons and Cite this. */
export function PageActions({ share = true, cite = true }) {
  return (
    <div className="mg-container">
      <div className="mg-grid mg-grid__col-2">
        {share && <ShareButtons SharingSubject={work.title} />}
        {cite && <CiteThis />}
      </div>
    </div>
  );
}

export default {
  title: 'Patterns/Page actions',
  component: PageActions,
  parameters: { layout: 'padded' },
};

export const ShareAndCite = {
  name: 'Share and cite',
  args: { share: true, cite: true },
};

export const ShareOnly = {
  name: 'Share only',
  args: { share: true, cite: false },
};

export const CiteOnly = {
  name: 'Cite only',
  args: { share: false, cite: true },
};
