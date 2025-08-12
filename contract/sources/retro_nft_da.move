module retro_nft::retro_nft_generator_da {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::option;
    use aptos_framework::timestamp;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;

    // Error codes
    /// Collection not found
    const ECOLLECTION_NOT_FOUND: u64 = 1;
    /// Collection already exists
    const ECOLLECTION_ALREADY_EXISTS: u64 = 2;
    /// Not authorized to perform this action
    const ENOT_AUTHORIZED: u64 = 3;
    /// Maximum supply reached
    const EMAX_SUPPLY_REACHED: u64 = 4;

    // Shared collection seed for deterministic resource account
    const SHARED_COLLECTION_SEED: vector<u8> = b"shared_collection_v1";

    // NFT Collection constants  
    const COLLECTION_NAME: vector<u8> = b"Retro 80s NFT Collection 2025-01-08-v2-unique";
    const COLLECTION_DESCRIPTION: vector<u8> = b"A collection of randomly generated retro 80s style NFTs with unique backgrounds, shapes, and word combinations using Aptos Digital Asset Standard";
    const COLLECTION_URI: vector<u8> = b"https://retrowave.nft/collection/2025-01-08-unique";
    const MAX_SUPPLY: u64 = 10000;

    // Background colors (5 options)
    const NEON_PINK: vector<u8> = b"#FF0080";
    const ELECTRIC_BLUE: vector<u8> = b"#0080FF";
    const CYBER_PURPLE: vector<u8> = b"#8000FF";
    const LASER_GREEN: vector<u8> = b"#00FF80";
    const SUNSET_ORANGE: vector<u8> = b"#FF8000";

    // Shape probabilities (log scale decrease from 20%)
    const SHAPE_NAMES: vector<vector<u8>> = vector[
        b"Circle", b"Square", b"Triangle", b"Diamond", b"Star", 
        b"Pentagon", b"Hexagon", b"Octagon", b"Cross", b"Heart",
        b"Arrow", b"Spiral", b"Infinity"
    ];

    // Cumulative probabilities (out of 10000 for precision)
    const SHAPE_CUMULATIVE_PROBS: vector<u64> = vector[
        2000, 3500, 4625, 5469, 6102, 6577, 6933, 7200, 7400, 7550, 
        7663, 7747, 7810
    ];

    // Four-letter words for combinations
    const FOUR_LETTER_WORDS: vector<vector<u8>> = vector[
        b"NEON", b"WAVE", b"GLOW", b"BEAM", b"FLUX", b"SYNC", b"GRID", b"CODE",
        b"BYTE", b"HACK", b"ECHO", b"VIBE", b"NOVA", b"ZETA", b"APEX", b"CORE",
        b"EDGE", b"FLOW", b"HYPE", b"IRIS", b"JADE", b"KILO", b"LOOP", b"MAZE",
        b"NEXT", b"OMNI", b"PACE", b"QUAD", b"RAVE", b"SAGE", b"TECH", b"UNIT",
        b"VOID", b"WARP", b"XRAY", b"YARN", b"ZOOM", b"BOLT", b"CALM", b"DAWN"
    ];

    // Collection resource stored at shared address
    struct NFTCollection has key {
        collection: Object<collection::Collection>,
        total_minted: u64,
        creator: address,
        // Store capability for minting tokens
        resource_cap: account::SignerCapability,
    }

    public struct NFTMetadata has store, drop, copy {
        background_color: String,
        shape: String,
        word_combination: String,
        token_id: u64,
    }

    // User's NFT collection - can store multiple NFTs
    struct UserNFTs has key {
        nfts: vector<TokenData>,
    }

    // Individual NFT data
    struct TokenData has store, drop, copy {
        collection_address: address,
        name: String,
        description: String,
        uri: String,
        metadata: NFTMetadata,
    }

    // Events
    #[event]
    struct NFTMintedEvent has drop, store {
        token_address: address,
        owner: address,
        metadata: NFTMetadata,
    }

    // Get the deterministic shared collection storage address
    public fun get_shared_collection_address(): address {
        // This creates a deterministic address from the module address + seed
        // This will ALWAYS be the same address regardless of who calls it
        account::create_resource_address(&@retro_nft, SHARED_COLLECTION_SEED)
    }

    // Initialize the shared collection - admin only, called once during deployment
    public entry fun initialize_shared_collection(admin: &signer) {
        let shared_addr = get_shared_collection_address();
        
        // Check if collection already exists at the shared address
        if (exists<NFTCollection>(shared_addr)) {
            return
        };
        
        // Create resource account at predictable address
        let (resource_signer, _resource_cap) = account::create_resource_account(
            admin,
            SHARED_COLLECTION_SEED
        );
        
        // Create unlimited collection using DA standard with resource account signer
        let collection_constructor_ref = collection::create_unlimited_collection(
            &resource_signer,
            string::utf8(COLLECTION_DESCRIPTION),
            string::utf8(COLLECTION_NAME),
            option::none(),
            string::utf8(COLLECTION_URI)
        );

        let collection_object = object::object_from_constructor_ref<collection::Collection>(
            &collection_constructor_ref
        );

        // Store collection resource at resource account address
        move_to(&resource_signer, NFTCollection {
            collection: collection_object,
            total_minted: 0,
            creator: shared_addr,
            resource_cap: _resource_cap,
        });
    }

    // Legacy function for backwards compatibility (now redirects to shared collection)
    public entry fun initialize_collection(user: &signer) {
        // For backwards compatibility, just initialize shared collection if it doesn't exist
        initialize_shared_collection(user);
    }

    // Mint a random NFT from the shared collection - anyone can call this
    public entry fun mint_random_nft(user: &signer) acquires NFTCollection, UserNFTs {
        let shared_addr = get_shared_collection_address();
        let collection_data = borrow_global_mut<NFTCollection>(shared_addr);
        
        // Check max supply
        assert!(collection_data.total_minted < MAX_SUPPLY, EMAX_SUPPLY_REACHED);
        
        let user_addr = signer::address_of(user);
        let current_time = timestamp::now_microseconds();
        
        // Generate random seed using timestamp and user address
        let addr_bytes = std::bcs::to_bytes(&user_addr);
        let addr_u64 = if (vector::length(&addr_bytes) >= 4) {
            (*vector::borrow(&addr_bytes, 0) as u64) +
            (*vector::borrow(&addr_bytes, 1) as u64) * 256 +
            (*vector::borrow(&addr_bytes, 2) as u64) * 65536 +
            (*vector::borrow(&addr_bytes, 3) as u64) * 16777216
        } else {
            12345u64
        };
        // Generate random NFT metadata
        let token_id = collection_data.total_minted + 1;
        
        // Include token_id in seed to ensure uniqueness across rapid mints
        let seed = current_time + addr_u64 + (token_id * 12345);
        let metadata = generate_random_metadata(seed, token_id);
        
        // Create NFT name and description
        let nft_name = string::utf8(b"Retro NFT #");
        string::append(&mut nft_name, string::utf8(std::bcs::to_bytes(&token_id)));
        
        let nft_description = string::utf8(b"A unique retro 80s NFT with ");
        string::append(&mut nft_description, metadata.background_color);
        string::append(&mut nft_description, string::utf8(b" background, "));
        string::append(&mut nft_description, metadata.shape);
        string::append(&mut nft_description, string::utf8(b" shape, and words: "));
        string::append(&mut nft_description, metadata.word_combination);
        
        // Create token URI with metadata
        let token_uri = create_token_uri(nft_name, nft_description, metadata);

        // Create actual Digital Asset token for explorer visibility
        // Anyone can mint from the shared collection - no authorization check needed
        
        // Get resource account signer using stored capability
        let resource_signer = account::create_signer_with_capability(&collection_data.resource_cap);
        
        let token_constructor_ref = token::create_named_token(
            &resource_signer, // Use resource account signer
            string::utf8(COLLECTION_NAME),
            nft_description,
            nft_name,
            option::none(),
            token_uri
        );
        
        // CRITICAL FIX: Transfer token ownership to user for explorer visibility
        let transfer_ref = object::generate_transfer_ref(&token_constructor_ref);
        let linear_transfer_ref = object::generate_linear_transfer_ref(&transfer_ref);
        object::transfer_with_ref(linear_transfer_ref, user_addr);
        
        let token_address = object::address_from_constructor_ref(&token_constructor_ref);
        
        // Create token data for our records
        let token_data = TokenData {
            collection_address: object::object_address(&collection_data.collection),
            name: nft_name,
            description: nft_description,
            uri: token_uri,
            metadata: metadata,
        };

        // Store token data in user's NFT collection for our internal tracking
        if (!exists<UserNFTs>(user_addr)) {
            // Create new user NFT collection if it doesn't exist
            move_to(user, UserNFTs {
                nfts: vector::empty<TokenData>(),
            });
        };
        
        // Add NFT to user's collection
        let user_nfts = borrow_global_mut<UserNFTs>(user_addr);
        vector::push_back(&mut user_nfts.nfts, token_data);

        // Update minted count
        collection_data.total_minted = collection_data.total_minted + 1;

        // Emit event
        event::emit(NFTMintedEvent {
            token_address,
            owner: user_addr,
            metadata,
        });
    }

    // Generate random metadata for NFT
    fun generate_random_metadata(seed: u64, token_id: u64): NFTMetadata {
        // Generate background color (simple modulo for 5 colors)
        let bg_index = (seed % 5);
        let background_color = if (bg_index == 0) {
            string::utf8(NEON_PINK)
        } else if (bg_index == 1) {
            string::utf8(ELECTRIC_BLUE)
        } else if (bg_index == 2) {
            string::utf8(CYBER_PURPLE)
        } else if (bg_index == 3) {
            string::utf8(LASER_GREEN)
        } else {
            string::utf8(SUNSET_ORANGE)
        };

        // Generate shape using weighted probabilities
        let shape_rand = ((seed / 7) % 10000);
        let shape_index = get_shape_index(shape_rand);
        let shape = string::utf8(*vector::borrow(&SHAPE_NAMES, shape_index));

        // Generate three random words
        let word_seed = seed / 13;
        let word1_index = (word_seed % vector::length(&FOUR_LETTER_WORDS));
        let word2_index = ((word_seed / 17) % vector::length(&FOUR_LETTER_WORDS));
        let word3_index = ((word_seed / 23) % vector::length(&FOUR_LETTER_WORDS));
        
        let word_combination = string::utf8(*vector::borrow(&FOUR_LETTER_WORDS, word1_index));
        string::append(&mut word_combination, string::utf8(b" "));
        string::append(&mut word_combination, string::utf8(*vector::borrow(&FOUR_LETTER_WORDS, word2_index)));
        string::append(&mut word_combination, string::utf8(b" "));
        string::append(&mut word_combination, string::utf8(*vector::borrow(&FOUR_LETTER_WORDS, word3_index)));

        NFTMetadata {
            background_color,
            shape,
            word_combination,
            token_id,
        }
    }

    // Get shape index based on weighted probabilities
    fun get_shape_index(rand: u64): u64 {
        let i = 0;
        let length = vector::length(&SHAPE_CUMULATIVE_PROBS);
        
        while (i < length) {
            if (rand < *vector::borrow(&SHAPE_CUMULATIVE_PROBS, i)) {
                return i
            };
            i = i + 1;
        };
        
        // Fallback to last shape
        length - 1
    }

    // Generate compact SVG shape based on shape name
    fun get_shape_svg(shape: String): String {
        let shape_bytes = *string::bytes(&shape);
        
        if (shape_bytes == b"Circle") {
            string::utf8(b"<circle cx=\"200\" cy=\"200\" r=\"60\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Square") {
            string::utf8(b"<rect x=\"140\" y=\"140\" width=\"120\" height=\"120\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Triangle") {
            string::utf8(b"<polygon points=\"200,140 260,260 140,260\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Diamond") {
            string::utf8(b"<polygon points=\"200,140 260,200 200,260 140,200\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Star") {
            string::utf8(b"<polygon points=\"200,140 210,170 240,170 220,190 230,220 200,200 170,220 180,190 160,170 190,170\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Pentagon") {
            string::utf8(b"<polygon points=\"200,140 230,160 220,200 180,200 170,160\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Hexagon") {
            string::utf8(b"<polygon points=\"200,140 230,160 230,200 200,220 170,200 170,160\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Octagon") {
            string::utf8(b"<polygon points=\"180,145 220,145 235,160 235,200 220,215 180,215 165,200 165,160\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Cross") {
            string::utf8(b"<polygon points=\"185,140 215,140 215,170 245,170 245,200 215,200 215,230 185,230 185,200 155,200 155,170 185,170\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Heart") {
            string::utf8(b"<path d=\"M200,160 C190,150 175,150 170,165 C165,180 185,200 200,220 C215,200 235,180 230,165 C225,150 210,150 200,160\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Arrow") {
            string::utf8(b"<polygon points=\"200,140 230,170 215,170 215,230 185,230 185,170 170,170\" fill=\"white\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Spiral") {
            string::utf8(b"<path d=\"M200,140 Q230,140 230,170 Q230,200 200,200 Q170,200 170,170 Q170,155 185,155 Q200,155 200,170\" stroke=\"white\" stroke-width=\"6\" fill=\"none\" opacity=\"0.9\"/>")
        } else if (shape_bytes == b"Infinity") {
            string::utf8(b"<path d=\"M170,190 Q185,175 200,190 Q215,205 230,190 Q215,175 200,190 Q185,205 170,190\" stroke=\"white\" stroke-width=\"6\" fill=\"none\" opacity=\"0.9\"/>")
        } else {
            // Default fallback
            string::utf8(b"<circle cx=\"200\" cy=\"200\" r=\"60\" fill=\"white\" opacity=\"0.9\"/>")
        }
    }

    // URL encode spaces as %20 for proper URL formatting
    fun url_encode_spaces(text: String): String {
        let encoded = string::utf8(b"");
        let length = string::length(&text);
        let i = 0;
        
        while (i < length) {
            let char_bytes = string::sub_string(&text, i, i + 1);
            if (char_bytes == string::utf8(b" ")) {
                string::append(&mut encoded, string::utf8(b"%20"));
            } else {
                string::append(&mut encoded, char_bytes);
            };
            i = i + 1;
        };
        
        encoded
    }

    // Generate image URL with metadata parameters
    fun generate_image_url(metadata: NFTMetadata): String {
        // Create a compact URL with parameters for a hosted image generator
        let image_url = string::utf8(b"https://www.aptosnft.com/api/nft/generate?bg=");
        
        // Add background color (remove # prefix for URL)
        let color_without_hash = string::sub_string(&metadata.background_color, 1, string::length(&metadata.background_color));
        string::append(&mut image_url, color_without_hash);
        
        // Add shape parameter
        string::append(&mut image_url, string::utf8(b"&shape="));
        string::append(&mut image_url, metadata.shape);
        
        // Add words parameter (URL encode spaces as %20)
        string::append(&mut image_url, string::utf8(b"&words="));
        let encoded_words = url_encode_spaces(metadata.word_combination);
        string::append(&mut image_url, encoded_words);
        
        image_url
    }

    // URL encode special characters for data URI
    fun url_encode_for_data_uri(text: String): String {
        let encoded = string::utf8(b"");
        let length = string::length(&text);
        let i = 0;
        
        while (i < length) {
            let char_bytes = string::sub_string(&text, i, i + 1);
            if (char_bytes == string::utf8(b"%")) {
                string::append(&mut encoded, string::utf8(b"%25"));
            } else if (char_bytes == string::utf8(b"\"")) {
                string::append(&mut encoded, string::utf8(b"%22"));
            } else if (char_bytes == string::utf8(b" ")) {
                string::append(&mut encoded, string::utf8(b"%20"));
            } else {
                string::append(&mut encoded, char_bytes);
            };
            i = i + 1;
        };
        
        encoded
    }

    // Create HTTP metadata URI (industry standard approach)
    fun create_token_uri(_name: String, _description: String, metadata: NFTMetadata): String {
        let token_uri = string::utf8(b"https://www.aptosnft.com/api/nft/metadata?id=");
        
        // Convert token ID to string and append
        let token_id_str = to_string(metadata.token_id);
        string::append(&mut token_uri, token_id_str);
        
        token_uri
    }

    // Helper function to convert u64 to string
    fun to_string(value: u64): String {
        if (value == 0) {
            return string::utf8(b"0")
        };
        
        let buffer = vector::empty<u8>();
        let temp_value = value;
        
        while (temp_value > 0) {
            let digit = ((temp_value % 10) as u8) + 48; // Convert to ASCII
            vector::push_back(&mut buffer, digit);
            temp_value = temp_value / 10;
        };
        
        // Reverse the buffer since we built it backwards
        vector::reverse(&mut buffer);
        string::utf8(buffer)
    }

    // View functions - use shared collection address
    #[view]
    public fun get_total_minted(): u64 acquires NFTCollection {
        let shared_addr = get_shared_collection_address();
        if (!exists<NFTCollection>(shared_addr)) {
            return 0
        };
        let collection_data = borrow_global<NFTCollection>(shared_addr);
        collection_data.total_minted
    }

    // Legacy function for backwards compatibility
    #[view] 
    public fun get_total_minted_legacy(_collection_creator: address): u64 acquires NFTCollection {
        // Redirect to shared collection
        get_total_minted()
    }

    #[view]
    public fun get_max_supply(): u64 {
        MAX_SUPPLY
    }

    #[view]
    public fun get_collection_address(): address acquires NFTCollection {
        let shared_addr = get_shared_collection_address();
        let collection_data = borrow_global<NFTCollection>(shared_addr);
        object::object_address(&collection_data.collection)
    }

    // Legacy function for backwards compatibility
    #[view]
    public fun get_collection_address_legacy(_collection_creator: address): address acquires NFTCollection {
        // Redirect to shared collection
        get_collection_address()
    }

    // Test helper function to preview what would be generated
    #[view]
    public fun preview_random_nft(seed: u64): NFTMetadata {
        generate_random_metadata(seed, 0)
    }


    #[test(aptos_framework = @0x1, admin = @retro_nft, user = @0x123)]
    fun test_initialize_shared_collection(
        aptos_framework: &signer,
        admin: &signer,
        user: &signer,
    ) acquires NFTCollection {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(user));
        
        // Initialize shared collection
        initialize_shared_collection(admin);
        
        // Check initial state
        assert!(get_total_minted() == 0, 1);
        assert!(get_max_supply() == 10000, 2);
    }


    #[test(aptos_framework = @0x1, admin = @retro_nft, user = @0x123)]
    fun test_mint_nft(
        aptos_framework: &signer,
        admin: &signer,
        user: &signer,
    ) acquires NFTCollection, UserNFTs {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
        timestamp::update_global_time_for_test_secs(1000);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(user));
        
        // Initialize shared collection
        initialize_shared_collection(admin);
        
        // Mint NFT - any user can mint from shared collection
        mint_random_nft(user);
        
        // Check that minted count increased
        assert!(get_total_minted() == 1, 3);
    }

    #[test]
    fun test_preview_random_nft() {
        // Test preview function with different seeds
        let metadata1 = preview_random_nft(12345);
        let metadata2 = preview_random_nft(67890);
        
        // Just verify that they generate without errors
        assert!(string::length(&metadata1.background_color) > 0, 4);
        assert!(string::length(&metadata2.background_color) > 0, 5);
    }
}