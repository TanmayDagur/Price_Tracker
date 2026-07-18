// Combined entrypoint for both price streaming and arbitrage calculations
console.log('Starting combined crypto price & arbitrage workers...');

import './price-worker';
import './arbitrage-worker';
