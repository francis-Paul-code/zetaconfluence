// Example usage of the functional queue monitoring system

import { 
  addToUserQueue, 
  getUserQueueSize, 
  removeFromUserQueue, 
  checkUserQueue 
} from './protocol';

import { 
  startPollingMonitor, 
  stopPollingMonitor, 
  type PollingConfig 
} from './queueMonitor';

// Example 1: Event-driven monitoring (from protocol.ts)
export const exampleEventDriven = () => {
  console.log('=== Event-driven Queue Example ===');
  
  // Add items to queue - automatically triggers when reaching 3 items
  addToUserQueue('item1', {
    data: 'test1',
    functionName: 'getSupportedAssets',
  });
  console.log(`Queue size: ${getUserQueueSize()}`);
  
  addToUserQueue('item2', {
    data: 'test2', 
    functionName: 'getSupportedAssets',
  });
  console.log(`Queue size: ${getUserQueueSize()}`);
  
  addToUserQueue('item3', {
    data: 'test3',
    functionName: 'getSupportedAssets', 
  });
  console.log(`Queue size: ${getUserQueueSize()}`); // This will trigger processing
  
  // Manual check if needed
  checkUserQueue();
  
  // Remove item if needed
  removeFromUserQueue('item1');
};

// Example 2: Polling-based monitoring
export const examplePollingBased = () => {
  console.log('=== Polling-based Queue Example ===');
  
  const testQueue = new Map();
  
  const config: PollingConfig<any> = {
    queue: testQueue,
    targetLength: 3,
    callback: async () => {
      console.log(`Processing ${testQueue.size} items...`);
      // Your processing logic here
      testQueue.clear();
      console.log('Queue cleared after processing');
    },
    pollInterval: 1000 // Check every second
  };
  
  // Start monitoring
  const intervalId = startPollingMonitor(config);
  
  // Simulate adding items over time
  setTimeout(() => {
    testQueue.set('item1', { data: 'test1' });
    console.log(`Added item1, queue size: ${testQueue.size}`);
  }, 500);
  
  setTimeout(() => {
    testQueue.set('item2', { data: 'test2' });
    console.log(`Added item2, queue size: ${testQueue.size}`);
  }, 1500);
  
  setTimeout(() => {
    testQueue.set('item3', { data: 'test3' });
    console.log(`Added item3, queue size: ${testQueue.size}`); // Will trigger processing
  }, 2500);
  
  // Stop monitoring after 5 seconds
  setTimeout(() => {
    stopPollingMonitor();
    console.log('Monitoring stopped');
  }, 5000);
};

// Example 3: Custom callback function
export const exampleCustomCallback = () => {
  console.log('=== Custom Callback Example ===');
  
  const customProcessing = async () => {
    console.log('🚀 Custom processing function triggered!');
    console.log('Processing queue items...');
    // Add your custom logic here
  };
  
  // Add items with custom callback
  addToUserQueue('custom1', {
    data: 'custom1',
    functionName: 'getSupportedAssets',
  }, customProcessing);
  
  addToUserQueue('custom2', {
    data: 'custom2', 
    functionName: 'getSupportedAssets',
  }, customProcessing);
  
  addToUserQueue('custom3', {
    data: 'custom3',
    functionName: 'getSupportedAssets',
  }, customProcessing); // This will trigger the custom callback
};