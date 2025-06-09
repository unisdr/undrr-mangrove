import React from "react";
import { Footer } from "./Footer";

export default {
  title: "Components/Footer",
  component: Footer,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      options: ["default", "minimal"],
      control: { type: "inline-radio" },
      description: "Visual variant of the Footer component",
      defaultValue: "default",
    },
    enableSyndication: {
      control: { type: "boolean" },
      description: "Enable/disable UNDRR syndicated footer content",
      defaultValue: true,
    },
    syndicationConfig: {
      control: { type: "object" },
      description: "Configuration object for UNDRR syndication widget",
    },
  },
  parameters: {
    docs: {
      description: {
        component: "Footer component with UNDRR Syndication support that allows sites to add complementary content above the global syndicated footer.",
      },
    },
  },
};

const Template = (args) => <Footer {...args} />;

export const Default = Template.bind({});
Default.args = {
  variant: "default",
  enableSyndication: true,
};
Default.parameters = {
  docs: {
    description: {
      story: "Default Footer with UNDRR syndicated content only. The syndicated content is loaded dynamically from the UNDRR system.",
    },
  },
};

export const WithComplementaryContent = Template.bind({});
WithComplementaryContent.args = {
  variant: "default",
  enableSyndication: true,
  complementaryContent: (
    <div className="custom-footer-content">
      <section className="about-footer | has-undrr-sendai-turquoise-background-color has-text-color has-background mg-container-full-width">
        <article className="container | wp-block-columns has-white-color">
          <section className="wp-block-column">
            <p className="about-footer--links pt-20">
              <a href="https://www.facebook.com/recoveryplatform.org">Facebook</a> &nbsp;
              <a href="https://www.twitter.com/irp_secretariat">X</a> &nbsp;
              <a href="https://www.youtube.com/user/IRPsecretariat">YouTube</a> &nbsp;
              <a href="https://www.flickr.com/photos/138349363@N04/albums">Flickr</a> &nbsp;
              <a href="https://recovery.preventionweb.net/contactus">Contact us</a>
            </p>
            <p className="lead pb-0 pt-20">
              <a href="/about-irp" style={{textDecoration: 'none'}}>
                The International Recovery Platform (IRP) is a global partnership working to strengthen knowledge,
                and share experiences and lessons on building back better in recovery, rehabilitation, and reconstruction
              </a>.
            </p>
          </section>
        </article>
      </section>
    </div>
  ),
};
WithComplementaryContent.parameters = {
  docs: {
    description: {
      story: "Footer with site-specific complementary content above the UNDRR syndicated footer. This demonstrates how sites can add their own footer sections while still including the global UNDRR footer.",
    },
  },
};

export const SyndicationOnly = Template.bind({});
SyndicationOnly.args = {
  variant: "default",
  enableSyndication: true,
  complementaryContent: null,
};
SyndicationOnly.parameters = {
  docs: {
    description: {
      story: "Footer with only UNDRR syndicated content, no site-specific additions.",
    },
  },
};

export const NoSyndication = Template.bind({});
NoSyndication.args = {
  variant: "default",
  enableSyndication: false,
  children: (
    <div className="local-footer-only">
      <div className="container">
        <p>This is a local footer without UNDRR syndication.</p>
        <p>Useful for testing or sites that don't want the global footer.</p>
      </div>
    </div>
  ),
};
NoSyndication.parameters = {
  docs: {
    description: {
      story: "Footer with syndication disabled, showing only local content. This is useful for testing or special cases where the UNDRR global footer is not desired.",
    },
  },
};

export const CustomSyndicationConfig = Template.bind({});
CustomSyndicationConfig.args = {
  variant: "default",
  enableSyndication: true,
  syndicationConfig: {
    contenttype: 'landingpage',
    pageid: '83835',
    includemetatags: false,
    includecss: false,
    suffixID: 'custom-footer',
    activedomain: 'www.undrr.org'
  },
  complementaryContent: (
    <div className="custom-site-footer">
      <div className="container">
        <h3>Custom Site Footer</h3>
        <p>This demonstrates a custom syndication configuration with site-specific content.</p>
      </div>
    </div>
  ),
};
CustomSyndicationConfig.parameters = {
  docs: {
    description: {
      story: "Footer with custom syndication configuration. This shows how to override the default syndication settings for specific pages or sites.",
    },
  },
};

export const MinimalVariant = Template.bind({});
MinimalVariant.args = {
  variant: "minimal",
  enableSyndication: true,
};
MinimalVariant.parameters = {
  docs: {
    description: {
      story: "Minimal variant of the Footer component with reduced styling and spacing.",
    },
  },
};