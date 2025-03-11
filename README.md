# Hedera Donation Widget

A customizable donation widget for websites that accepts HBAR and stablecoins (USDC) on the Hedera network.

## Features

- **Easy Integration**: Simply add a script tag to your website
- **Customizable**: Change colors, titles, and other settings
- **Wallet Support**: Connect with HashPack wallet (Hedera's leading wallet)
- **Token Support**: Accept HBAR and USDC (Testnet by default)
- **Responsive**: Works on all device sizes

## Quick Start

### Basic Integration

Add the following code to your HTML:

```html
<!-- 1. Add the container where you want the widget to appear -->
<div id="hedera-donation-widget"></div>

<!-- 2. Add the widget script -->
<script src="https://your-cdn-url/embed.js"></script>

<!-- 3. Initialize the widget -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    initHederaDonationWidget({
      receiverId: '0.0.YOUR_HEDERA_ACCOUNT_ID', // Replace with your Hedera account ID
      title: 'Support Our Project',
      primaryColor: '#3182ce' // Use your brand color
    });
  });
</script>
```

### HTML Data Attributes Integration

You can also initialize the widget using data attributes:

```html
<!-- Widget with data attributes -->
<div id="my-donation-widget" 
     data-hedera-widget 
     data-receiver-id="0.0.YOUR_HEDERA_ACCOUNT_ID" 
     data-title="Support Our Project" 
     data-primary-color="#3182ce"
     data-max-width="450px"
     data-testnet="true">
</div>

<!-- Widget script -->
<script src="https://your-cdn-url/embed.js"></script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerId` | string | 'hedera-donation-widget' | ID of the container element |
| `receiverId` | string | '0.0.5680094' | Hedera account ID to receive donations |
| `title` | string | 'Hedera Donation Widget' | Widget title |
| `primaryColor` | string | '#00a79d' | Primary color for buttons (HEX value) |
| `showFooter` | boolean | true | Show footer with network info |
| `testnet` | boolean | true | Use Hedera testnet (recommended for testing) |
| `maxWidth` | string | '500px' | Maximum width of the widget |

## Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start development server:
   ```
   npm run dev
   ```
4. Build for production:
   ```
   npm run build
   ```

## Advanced Usage

### Using with React

If you're using React, you can import the widget directly:

```jsx
import { createHederaDonationWidget } from 'hedera-widget';

function YourComponent() {
  useEffect(() => {
    createHederaDonationWidget('donation-container', {
      receiverId: '0.0.YOUR_HEDERA_ACCOUNT_ID',
      title: 'Support Us'
    });
  }, []);

  return <div id="donation-container"></div>;
}
```

### Mainnet vs Testnet

For testing, the widget uses Hedera's Testnet by default. For production use, set the `testnet` option to `false`:

```js
initHederaDonationWidget({
  receiverId: '0.0.YOUR_HEDERA_ACCOUNT_ID',
  testnet: false // Use mainnet
});
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React, Chakra UI, and the HashConnect SDK
- Uses Hedera's JavaScript SDK for blockchain interactions
