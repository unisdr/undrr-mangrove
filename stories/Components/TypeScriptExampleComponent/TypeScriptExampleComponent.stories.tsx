import React from "react";
import TypeScriptExampleComponent from "./TypeScriptExampleComponent"
import { ComponentMeta, ComponentStory} from "@storybook/react"

export default {
  title: "Example/TypeScript Component",
  component: TypeScriptExampleComponent,
} as ComponentMeta<typeof TypeScriptExampleComponent>

const Template: ComponentStory<typeof TypeScriptExampleComponent> = (args: React.ComponentProps<typeof TypeScriptExampleComponent>) => <TypeScriptExampleComponent {...args} />;
export const Submit = Template.bind({});
Submit.args = {
  label: 'Button',
  type: 'Secondary',
  width: 400,
};

export const Check = Template.bind({});
Check.args = {
  label: 'Button',
  type: 'Secondary',
  width: 400,
};
