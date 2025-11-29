// Functional approach: Polling-based queue monitor

// State for polling monitor
let pollingIntervalId: NodeJS.Timeout | null = null;
let pollingIsProcessing = false;

// Create a polling monitor configuration
export interface PollingConfig<T> {
  queue: Map<string, T>;
  targetLength: number;
  callback: () => void | Promise<void>;
  pollInterval?: number; // Check every X ms (default 1000)
}

// Check queue length and trigger callback if needed
const checkQueuePolling = <T>(config: PollingConfig<T>) => {
  if (config.queue.size >= config.targetLength && !pollingIsProcessing) {
    pollingIsProcessing = true;
    console.log(`Queue reached target length (${config.queue.size}/${config.targetLength}), processing...`);
    
    Promise.resolve(config.callback())
      .then(() => {
        pollingIsProcessing = false;
      })
      .catch((error) => {
        console.error('Queue callback error:', error);
        pollingIsProcessing = false;
      });
  }
};

// Start continuous monitoring
export const startPollingMonitor = <T>(config: PollingConfig<T>) => {
  if (pollingIntervalId) {
    console.warn('Queue monitoring is already active');
    return pollingIntervalId;
  }

  const interval = config.pollInterval || 1000;
  pollingIntervalId = setInterval(() => {
    checkQueuePolling(config);
  }, interval);

  console.log(`Started queue monitoring (checking every ${interval}ms)`);
  return pollingIntervalId;
};

// Stop continuous monitoring
export const stopPollingMonitor = () => {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    console.log('Stopped queue monitoring');
    return true;
  }
  return false;
};

// Manual check (useful for event-driven approach)
export const manualCheckPolling = <T>(config: PollingConfig<T>) => {
  checkQueuePolling(config);
};

// Check if monitoring is active
export const isPollingActive = () => {
  return pollingIntervalId !== null;
};

// Get current queue size
export const getPollingQueueSize = <T>(queue: Map<string, T>) => {
  return queue.size;
};

// Usage example:
/*
const userQueue = new Map();
const config = {
  queue: userQueue,
  targetLength: 3,
  callback: async () => {
    console.log('Processing queue batch...');
    // Your processing logic here
    userQueue.clear();
  },
  pollInterval: 500 // Check every 500ms
};

// Start monitoring
startPollingMonitor(config);

// Add items to queue
userQueue.set('item1', { data: 'test1' });
userQueue.set('item2', { data: 'test2' });
userQueue.set('item3', { data: 'test3' }); // This will trigger processing

// Stop monitoring when done
stopPollingMonitor();
*/