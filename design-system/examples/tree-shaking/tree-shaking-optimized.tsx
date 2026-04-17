// Tree-shaking optimized imports (smaller bundle)
import { AccessibleButton } from '@ticketiq/design-system/core';
import { AnimatedButton } from '@ticketiq/design-system/animation';
import { Modal } from '@ticketiq/design-system/feedback';

// Or import entire categories as needed
import * as CoreComponents from '@ticketiq/design-system/core';
import * as AnimationComponents from '@ticketiq/design-system/animation';

// Usage
const MyComponent = () => (
  <div>
    <AccessibleButton>Click me</AccessibleButton>
    <AnimationComponents.AnimatedButton>Animated</AnimationComponents.AnimatedButton>
    <Modal>Content</Modal>
  </div>
);