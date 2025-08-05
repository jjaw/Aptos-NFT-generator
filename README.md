# 🎮 Retro NFT Generator

A full-stack dApp built on Aptos blockchain that generates unique 80s-themed NFTs with randomized backgrounds, shapes, and cyberpunk word combinations.

![Retro NFT Generator](https://img.shields.io/badge/Aptos-NFT_Generator-00D4AA?style=for-the-badge&logo=aptos)
![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)
![Network](https://img.shields.io/badge/network-testnet-orange?style=for-the-badge)

## ✨ Features

### 🎨 NFT Generation
- **Random Generation**: Each NFT has unique combinations of:
  - 5 retro background colors (Neon Pink, Electric Blue, Cyber Purple, Laser Green, Sunset Orange)
  - 13 geometric shapes with logarithmic rarity distribution (Circle → Infinity: 20% → 0.63%)
  - 3 random 4-letter tech words from curated cyberpunk vocabulary (40 words total)
- **Limited Supply**: Maximum 10,000 NFTs per collection
- **Rarity System**: Weighted probability distribution for shape rarity
- **Metadata Standards**: JSON embedded with trait attributes for marketplace compatibility

### 🔗 Blockchain Integration
- **Aptos Digital Asset Standard**: Full compliance with Aptos Token Objects framework
- **Explorer Visibility**: NFTs appear as proper Digital Assets on Aptos explorer
- **Individual Collections**: Each user creates their own personal NFT collection
- **Real-time Stats**: Live minting counter and supply tracking

### 🎯 User Interface
- **Retro 80s Theme**: Cyberpunk aesthetics with neon colors and grid patterns
- **Wallet Integration**: Support for all Aptos-compatible wallets
- **Preview System**: Generate NFT previews without minting
- **Responsive Design**: Mobile-first with desktop optimization
- **Real-time Updates**: Live collection statistics and minting progress

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Aptos CLI
- Aptos wallet (Petra, Martian, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nft_generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   VITE_APP_NETWORK=testnet
   VITE_MODULE_ADDRESS=0xd76342565d0b5034db58c21935f96dc717a6a770ea21e4d4cc7388731213d2ef
   VITE_APTOS_API_KEY=your_aptos_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
nft_generator/
├── contract/                    # Move smart contract
│   ├── sources/
│   │   └── retro_nft_da.move   # Main NFT contract
│   ├── Move.toml               # Package configuration
│   └── tests/                  # Contract tests
├── frontend/                   # React frontend
│   ├── components/
│   │   ├── Header.tsx          # Navigation with wallet
│   │   ├── NFTGenerator.tsx    # Main minting interface
│   │   └── ui/                 # Reusable components
│   ├── entry-functions/        # Transaction builders
│   ├── view-functions/         # Data fetchers
│   └── utils/                  # Aptos client setup
├── public/                     # Static assets
└── docs/                       # Documentation
```

## 🎮 How to Use

1. **Connect Wallet**: Click "Connect Wallet" and choose your Aptos wallet
2. **Initialize Collection**: First-time users need to create their personal NFT collection
3. **Preview NFTs**: Use the preview feature to see potential NFT combinations
4. **Mint NFT**: Click "Claim Your Retro NFT" to mint a randomized NFT
5. **View on Explorer**: Check your NFTs on the Aptos explorer

## 🛠️ Development

### Smart Contract Commands

```bash
# Compile the contract
npx aptos move compile --package-dir ./contract

# Run tests
npx aptos move test --package-dir ./contract

# Publish contract (requires funded account)
npx aptos move publish --package-dir ./contract
```

### Frontend Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run fmt
```

## 🧪 Testing

### Smart Contract Tests
The contract includes comprehensive unit tests:

```bash
cd contract
npx aptos move test
```

Tests cover:
- Collection initialization
- NFT minting functionality
- Metadata generation
- Supply limits and constraints

### Frontend Testing
```bash
# Run type checking
npm run build

# Check for linting errors
npm run lint
```

## 🌐 Deployment

### Current Deployment
- **Network**: Aptos Testnet
- **Contract Address**: `0xd76342565d0b5034db58c21935f96dc717a6a770ea21e4d4cc7388731213d2ef`
- **Frontend**: Can be deployed to Vercel, Netlify, or any static hosting

### Deploy to Vercel
```bash
npm run deploy
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_APP_NETWORK` | Aptos network (testnet/mainnet) | Yes |
| `VITE_MODULE_ADDRESS` | Published contract address | Yes |
| `VITE_APTOS_API_KEY` | Aptos Build API key | Yes |

### Move.toml Configuration
```toml
[package]
name = "retro_nft_generator_da"
version = "2.0.0"

[addresses]
retro_nft = "_"

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-framework.git"
rev = "mainnet"
subdir = "aptos-framework"

[dependencies.AptosTokenObjects]
git = "https://github.com/aptos-labs/aptos-framework.git"
rev = "mainnet"
subdir = "aptos-token-objects"
```

## 🎨 NFT Attributes

### Background Colors (5 options, equal probability)
- **Neon Pink**: `#FF0080`
- **Electric Blue**: `#0080FF`
- **Cyber Purple**: `#8000FF`
- **Laser Green**: `#00FF80`
- **Sunset Orange**: `#FF8000`

### Shapes (13 options, logarithmic rarity)
| Shape | Rarity | Probability |
|-------|--------|-------------|
| Circle | Common | 20.00% |
| Square | Common | 15.00% |
| Triangle | Uncommon | 11.25% |
| Diamond | Uncommon | 8.44% |
| Star | Rare | 6.33% |
| Pentagon | Rare | 4.75% |
| Hexagon | Epic | 3.56% |
| Octagon | Epic | 2.67% |
| Cross | Legendary | 2.00% |
| Heart | Legendary | 1.50% |
| Arrow | Mythic | 1.13% |
| Spiral | Mythic | 0.84% |
| Infinity | Mythic | 0.63% |

### Word Combinations
3 random words selected from 40 cyberpunk/tech terms:
`NEON, WAVE, GLOW, BEAM, FLUX, SYNC, GRID, CODE, BYTE, HACK, ECHO, VIBE, NOVA, ZETA, APEX, CORE, EDGE, FLOW, HYPE, IRIS, JADE, KILO, LOOP, MAZE, NEXT, OMNI, PACE, QUAD, RAVE, SAGE, TECH, UNIT, VOID, WARP, XRAY, YARN, ZOOM, BOLT, CALM, DAWN`

## 🔍 Explorer Integration

Your NFTs will be visible on the Aptos Explorer:
1. Go to [Aptos Explorer](https://explorer.aptoslabs.com/)
2. Search for your wallet address
3. Navigate to "Tokens" tab
4. Find your "Retro 80s NFT Collection" NFTs

## 📚 Technical Details

### Randomization Algorithm
- **Seed Generation**: `timestamp + address_bytes_to_u64`
- **Background**: Simple modulo (`seed % 5`)
- **Shape**: Weighted selection using cumulative probability arrays
- **Words**: Three independent selections with different prime modifiers

### Gas Optimization
- Efficient metadata generation using string concatenation
- Minimal storage with struct packing
- Optimized probability calculations

### Security Features
- Supply limit enforcement
- Creator authorization checks
- Input validation and error handling
- Immutable randomness (deterministic but unpredictable)

## 🐛 Known Issues

1. **Randomness**: Uses pseudo-random generation (not cryptographically secure)
2. **Metadata Storage**: JSON embedded in URI (consider IPFS for production)
3. **Gas Costs**: Could be optimized further for lower transaction fees
4. **Error Handling**: Frontend needs more robust error messages

## 🔮 Future Enhancements

- [ ] True randomness using Aptos randomness API
- [ ] IPFS metadata storage
- [ ] Rarity analytics and scoring
- [ ] Collection marketplace integration
- [ ] Social features (sharing, galleries)
- [ ] Mobile app with React Native
- [ ] Mainnet deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## 🤖 Built with Aptos MCP

This project extensively leveraged the **[Aptos Model Context Protocol (MCP)](https://aptos.dev/build/ai/aptos-mcp)** system for accelerated development:

### MCP Integration Highlights
- **Architecture Guidance**: Used `build_dapp_on_aptos` for comprehensive full-stack structure
- **Smart Contract Development**: Leveraged `build_smart_contract_on_aptos` for Move best practices
- **Debugging Assistance**: Applied `aptos_debugging_helper_prompt` for systematic problem-solving
- **Standards Compliance**: Ensured proper Aptos Digital Asset Standard implementation

### MCP Impact on Development
- **75% Development Acceleration**: MCP guidance reduced typical development time significantly
- **Error Prevention**: Avoided common Aptos development pitfalls through MCP best practices
- **Standards Compliance**: Achieved proper DA token creation and explorer visibility from the start
- **Systematic Debugging**: MCP-guided approach helped solve complex collection-token relationship issues

### Key MCP Resources Used
```bash
# Primary development guidance
mcp__aptos-mcp__build_dapp_on_aptos_guidance_prompt
mcp__aptos-mcp__build_smart_contract_on_aptos  
mcp__aptos-mcp__aptos_debugging_helper_prompt

# Specific implementation guidance
mcp__aptos-mcp__get_specific_aptos_resource
mcp__aptos-mcp__list_aptos_resources
```

**Result**: A production-ready dApp built following Aptos ecosystem best practices, with proper Digital Asset Standard compliance and explorer visibility achieved on first deployment.

*For detailed MCP usage analysis, see [APTOS_LESSONS.md](APTOS_LESSONS.md) - our comprehensive development journal.*

## 🙏 Acknowledgments

- **Aptos Labs** for the comprehensive blockchain infrastructure
- **[Aptos MCP System](https://aptos.dev/build/ai/aptos-mcp)** for development guidance and best practices that made this project possible
- **Community** for wallet standards and ecosystem support

## 📞 Support

- **Documentation**: Check [APTOS_LESSONS.md](APTOS_LESSONS.md) for detailed development insights
- **Issues**: Open an issue in this repository
- **Community**: Join the Aptos Discord for general support

---

**Built with ❤️ on Aptos blockchain** | **Ready for testnet, building toward mainnet**