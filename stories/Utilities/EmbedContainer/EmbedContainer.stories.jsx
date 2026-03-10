import React from 'react';

export default {
  title: 'Utilities/EmbedContainer',
  parameters: {
    layout: 'padded',
  },
};

export const Default16x9 = {
  name: '16:9 (default)',
  render: () => (
    <div style={{ maxWidth: '640px' }}>
      <div className="mg-embed-container">
        <iframe
          src="https://www.youtube-nocookie.com/embed/bIpPtHJbV-Q"
          title="UNDRR video (16:9)"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  ),
};

export const AspectRatio4x3 = {
  name: '4:3',
  render: () => (
    <div style={{ maxWidth: '640px' }}>
      <div className="mg-embed-container mg-embed-container--4x3">
        <iframe
          src="https://www.youtube-nocookie.com/embed/0fKBhvDjuy0"
          title="Powers of Ten (1977) — Eames Office (4:3)"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  ),
};

export const AspectRatio1x1 = {
  name: '1:1',
  render: () => (
    <div style={{ maxWidth: '480px' }}>
      <div className="mg-embed-container mg-embed-container--1x1">
        <iframe
          src="https://www.youtube-nocookie.com/embed/7tCU7ee1NNM"
          title="UNDRR YouTube Short (1:1 container)"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  ),
};

export const AspectRatio21x9 = {
  name: '21:9 (ultrawide)',
  render: () => (
    <div style={{ maxWidth: '800px' }}>
      <p
        style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}
      >
        Ultrawide (21:9) is useful for cinematic content or wide data
        visualizations. Most YouTube videos will show black bars at the sides.
      </p>
      <div className="mg-embed-container mg-embed-container--21x9">
        <iframe
          src="https://www.youtube-nocookie.com/embed/Ttl8Gg-P-Ao"
          title="Ultrawide cinematic video (21:9)"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  ),
};

const aspectRatioOptions = {
  '16:9 (default)': '',
  '4:3': 'mg-embed-container--4x3',
  '1:1': 'mg-embed-container--1x1',
  '21:9 (ultrawide)': 'mg-embed-container--21x9',
};

export const GenericIframe = {
  name: 'Generic HTML iframe',
  argTypes: {
    aspectRatio: {
      control: 'select',
      options: Object.keys(aspectRatioOptions),
      mapping: aspectRatioOptions,
      description: 'Aspect ratio modifier class',
    },
  },
  args: {
    aspectRatio: '',
  },
  render: args => {
    const classes = ['mg-embed-container', args.aspectRatio]
      .filter(Boolean)
      .join(' ');
    return (
      <article className={classes}>
        <iframe
          src="about:blank"
          title="Generic HTML embed"
          loading="lazy"
          style={{
            background: '#f0f0f0',
          }}
          ref={el => {
            if (!el) return;
            const doc = el.contentDocument;
            if (!doc) return;
            doc.open();
            doc.write(
              `<div style="
                font-family: system-ui, sans-serif;
                color: #2c6e7e;
                text-align: center;
                padding: 2rem;
              ">
                <div>
                  <h2>Embedded content</h2>
                  <p>
                    Any HTML page, dashboard, or third-party widget
                    renders responsively inside mg-embed-container.
                  </p>
                </div>
              </div>`
            );
            doc.close();
          }}
        />
      </article>
    );
  },
};

export const InsideHighlightBox = {
  name: 'Inside highlight box',
  render: () => (
    <div className="mg-highlight-box mg-highlight-box--secondary mg-highlight-box--centered mb-20">
      <figure>
        <h3>Related video: Disaster risk reduction explained</h3>
        <div className="mg-embed-container">
          <iframe
            src="https://www.youtube-nocookie.com/embed/bIpPtHJbV-Q"
            title="Related video: Disaster risk reduction explained"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <figcaption className="mt-10">
          Caption describing the related video.
        </figcaption>
      </figure>
    </div>
  ),
};

export const InsideHighlightBoxPrimary = {
  name: 'Inside highlight box (primary)',
  render: () => (
    <div className="mg-highlight-box mg-highlight-box--primary mg-highlight-box--centered mb-20">
      <figure>
        <h3>Related video: Climate change and health</h3>
        <div className="mg-embed-container">
          <iframe
            src="https://www.youtube-nocookie.com/embed/bIpPtHJbV-Q"
            title="Related video: Climate change and health"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <figcaption className="mt-10">
          Caption describing the related video.
        </figcaption>
      </figure>
    </div>
  ),
};
