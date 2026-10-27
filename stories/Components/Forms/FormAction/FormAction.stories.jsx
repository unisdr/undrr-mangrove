import { FormAction } from './FormAction';

export default {
  title: 'Components/Forms/Form action',
  component: FormAction,
};

export const Search = {
  render: () => (
    <form role="search" onSubmit={event => event.preventDefault()}>
      <FormAction
        label="Search publications"
        hideLabel
        control={
          <input
            className="mg-form-input"
            type="search"
            placeholder="Search publications"
          />
        }
        action={
          <button className="mg-button mg-button-primary" type="submit">
            Search
          </button>
        }
      />
    </form>
  ),
};

export const Subscribe = {
  render: () => (
    <form onSubmit={event => event.preventDefault()}>
      <FormAction
        label="Email address"
        helpText="One concise action stays visually attached to its field."
        control={
          <input
            className="mg-form-input"
            type="email"
            placeholder="name@example.org"
          />
        }
        action={
          <button className="mg-button mg-button-primary" type="submit">
            Subscribe
          </button>
        }
      />
    </form>
  ),
};

export const SelectAndContinue = {
  render: () => (
    <form onSubmit={event => event.preventDefault()}>
      <FormAction
        label="Reporting period"
        control={
          <select className="mg-form-select" defaultValue="2026">
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        }
        action={
          <button className="mg-button mg-button-primary" type="submit">
            Continue
          </button>
        }
      />
    </form>
  ),
  name: 'Select and continue',
};

export const StackedOnMobile = {
  render: () => (
    <form onSubmit={event => event.preventDefault()}>
      <FormAction
        label="Email address"
        stackOnMobile
        control={
          <input
            className="mg-form-input"
            type="email"
            placeholder="name@example.org"
          />
        }
        action={
          <button className="mg-button mg-button-primary" type="submit">
            Subscribe for updates
          </button>
        }
      />
    </form>
  ),
  name: 'Stacked on mobile',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const RTL = {
  render: () => (
    <form dir="rtl" lang="ar" onSubmit={event => event.preventDefault()}>
      <FormAction
        label="البريد الإلكتروني"
        control={
          <input
            className="mg-form-input"
            type="email"
            placeholder="name@example.org"
          />
        }
        action={
          <button className="mg-button mg-button-primary" type="submit">
            اشترك
          </button>
        }
      />
    </form>
  ),
};
