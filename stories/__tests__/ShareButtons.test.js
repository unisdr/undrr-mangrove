import React from 'react';

import ShareButtons from '../Components/Buttons/ShareButtons/ShareButtons';
import { CopyButton } from '../Components/Buttons/ShareButtons/ShareButtons';

import { render, fireEvent, screen } from '@testing-library/react';

// import jest

import { jest } from '@jest/globals';

const labels = {

  mainLabel: 'SHARE THIS',

  onCopy: 'Copied',

};

const SharingSubject = 'Test Subject';

const SharingTextBody = 'Test Body: ';

describe('ShareButtons Component', () => {

  // Mock the window.open method because it can not be called in a test environment

  window.open = jest.fn();

  //mock data for the input params



  it('Has all labels', () => {

    const { getByText, getByLabelText } = render(

      <ShareButtons labels={labels} SharingSubject={SharingSubject} SharingTextBody={SharingTextBody} />

    );

    // expect the text labels.mainLabel to be in the document

    expect(getByText(labels.mainLabel)).toBeInTheDocument;

    expect(getByLabelText('Share on Facebook')).toBeInTheDocument;

    expect(getByLabelText('Share on Twitter')).toBeInTheDocument;

    expect(getByLabelText('Share on LinkedIn')).toBeInTheDocument;

    expect(getByLabelText('Share via Email')).toBeInTheDocument;

  });

  it('Clicking on Facebook button opens a new window with the Facebook share link', () => {

    const { getByLabelText } = render(

      <ShareButtons labels={labels} SharingSubject={SharingSubject} SharingTextBody={SharingTextBody} />

    );

    const facebookButton = getByLabelText('Share on Facebook');

    // Mock the window.open method to check if it's called with the correct URL

    const windowOpenSpy = jest.spyOn(window, 'open');

    fireEvent.click(facebookButton);

    expect(windowOpenSpy).toHaveBeenCalledWith(

      'https://facebook.com/sharer/sharer.php?u=Test%20Body%3A%20http%3A%2F%2Flocalhost%2F',

      '_blank',

      'width=600,height=300'

    );

  });

  it('Clicking on Twitter button opens a new window with the Twitter share link', () => {

    const { getByLabelText } = render(

      <ShareButtons labels={labels} SharingSubject={SharingSubject} SharingTextBody={SharingTextBody} />

    );

    const twitterButton = getByLabelText('Share on Twitter');

    const windowOpenSpy = jest.spyOn(window, 'open');

    fireEvent.click(twitterButton);

    expect(windowOpenSpy).toHaveBeenCalledWith(

      'https://twitter.com/intent/tweet?text=Test%20Body%3A%20http%3A%2F%2Flocalhost%2F',

      '_blank',

      'width=600,height=300'

    );

  });

  it('Clicking on LinkedIn button opens a new window with the LinkedIn share link', () => {

    const { getByLabelText } = render(

      <ShareButtons labels={labels} SharingSubject={SharingSubject} SharingTextBody={SharingTextBody} />

    );

    const linkedInButton = getByLabelText('Share on LinkedIn');

    const windowOpenSpy = jest.spyOn(window, 'open');

    fireEvent.click(linkedInButton);

    expect(windowOpenSpy).toHaveBeenCalledWith(

      'https://www.linkedin.com/sharing/share-offsite/?url=Test%20Body%3A%20http%3A%2F%2Flocalhost%2F',

      '_blank',

      'width=600,height=300'

    );

  });

});

describe('CopyButton', () => {

  it('Copies the link to clipboard', () => {

    navigator.clipboard = { writeText: jest.fn() };

    render(<CopyButton copiedLabel="Copied" sharedLink="https://example.com" />);

    const copyButton = screen.getByLabelText('Copy to Clipboard');

    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com");

  });

  it('Shows copied label after copying', () => {

    render(<CopyButton copiedLabel="Copied" sharedLink="https://example.com" />);

    const copyButton = screen.getByLabelText('Copy to Clipboard');

    fireEvent.click(copyButton);

    const copiedLabel = screen.getByText(labels.onCopy);

  });

});

