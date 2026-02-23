import React from 'react';
import { Footer } from './Footer';

export default {
  title: 'Components/Footer',
  component: Footer,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      options: ['default', 'minimal'],
      control: { type: 'inline-radio' },
      description: 'Visual variant of the Footer component',
      defaultValue: 'default',
    },
    enableSyndication: {
      control: { type: 'boolean' },
      description: 'Enable/disable UNDRR syndicated footer content',
      defaultValue: true,
    },
    syndicationConfig: {
      control: { type: 'object' },
      description: 'Configuration object for UNDRR syndication widget',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Footer component with UNDRR Syndication support that allows sites to add complementary content above the global syndicated footer.',
      },
    },
  },
};

export const Default = {
  args: {
    variant: 'default',
    enableSyndication: true,
    syndicationConfig: {
      suffixID: 'footer-default',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default Footer with UNDRR syndicated content only. The syndicated content is loaded dynamically from the UNDRR system.',
      },
    },
  },
};

export const WithComplementaryContent = {
  args: {
    variant: 'default',
    enableSyndication: true,
    syndicationConfig: {
      suffixID: 'footer-complementary',
    },
    complementaryContent: (
      <section className="mg-footer--about-footer | has-undrr-sendai-turquoise-background-color has-background mg-container-full-width">
        <article className="mg-container">
          <p className="mg-footer--about-footer--links">
            <a href="https://www.facebook.com/recoveryplatform.org">Facebook</a>{' '}
            <a href="https://www.twitter.com/irp_secretariat">X</a>
            <a href="https://www.youtube.com/user/IRPsecretariat">
              YouTube
            </a>{' '}
            <a href="https://www.flickr.com/photos/138349363@N04/albums">
              Flickr
            </a>{' '}
            <a href="https://recovery.preventionweb.net/contactus">
              Contact us
            </a>
          </p>
          <p className="mg-footer--about-footer--description">
            <a
              href="https://recovery.preventionweb.net/about-irp"
              style={{ textDecoration: 'none' }}
            >
              The International Recovery Platform (IRP) is a global partnership
              working to strengthen knowledge, and share experiences and lessons
              on building back better in recovery, rehabilitation, and
              reconstruction
            </a>
            .
          </p>
        </article>
      </section>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Footer with site-specific complementary content above the UNDRR syndicated footer. This demonstrates how sites can add their own footer sections while still including the global UNDRR footer.',
      },
    },
  },
};

export const NoSyndication = {
  args: {
    variant: 'default',
    enableSyndication: false,
    syndicationConfig: {
      suffixID: 'footer-no-syndication',
    },
    children: (
      <div className="mg-container">
        <p>This is a local footer without UNDRR syndication.</p>
        <p>Useful for testing or sites that don't want the global footer.</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Footer with syndication disabled, showing only local content. This is useful for testing or special cases where the UNDRR global footer is not desired.',
      },
    },
  },
};

export const CustomSyndicationConfig = {
  args: {
    variant: 'default',
    enableSyndication: true,
    syndicationConfig: {
      contenttype: 'landingpage',
      pageid: '83835',
      includemetatags: false,
      includecss: true,
      suffixID: 'footer-custom-config',
      activedomain: 'www.undrr.org',
    },
    complementaryContent: (
      <div className="mg-container">
        <h3>Custom Site Footer</h3>
        <p>
          This demonstrates a custom syndication configuration with
          site-specific content.
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Footer with custom syndication configuration. This shows how to override the default syndication settings for specific pages or sites.',
      },
    },
  },
};
