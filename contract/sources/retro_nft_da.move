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

    // Fixed creator address for shared collection - this will be the module's address
    const SHARED_CREATOR_ADDRESS: address = @retro_nft;

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

    // Collection resource stored at creator's address
    struct NFTCollection has key {
        collection: Object<collection::Collection>,
        total_minted: u64,
        creator: address,
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
        let module_addr = @retro_nft;
        account::create_resource_address(&module_addr, b"shared_collection")
    }

    // Initialize the collection - creates it at a predictable shared address
    public entry fun initialize_collection(user: &signer) {
        let shared_addr = get_shared_collection_address();
        
        // Check if collection already exists at the shared address
        if (exists<NFTCollection>(shared_addr)) {
            return
        };
        
        // The trick: Create a resource account from the user, but with a seed that when combined
        // with the user creates the same address as our get_shared_collection_address function
        // But that's not possible because the address depends on the user...
        
        // FINAL SOLUTION: Store at user's address and provide the user address to frontend!
        let user_addr = signer::address_of(user);
        
        // Check if this user already has a collection  
        if (exists<NFTCollection>(user_addr)) {
            return
        };
        
        // Create unlimited collection using DA standard
        let collection_constructor_ref = collection::create_unlimited_collection(
            user,
            string::utf8(COLLECTION_DESCRIPTION),
            string::utf8(COLLECTION_NAME),
            option::none(),
            string::utf8(COLLECTION_URI)
        );

        let collection_object = object::object_from_constructor_ref<collection::Collection>(
            &collection_constructor_ref
        );

        // Store collection resource at user's address
        move_to(user, NFTCollection {
            collection: collection_object,
            total_minted: 0,
            creator: user_addr,
        });
    }

    // Mint a random NFT using DA standard - requires the collection creator address
    public entry fun mint_random_nft(user: &signer, collection_creator: address) acquires NFTCollection, UserNFTs {
        let collection_data = borrow_global_mut<NFTCollection>(collection_creator);
        
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
        let seed = current_time + addr_u64;
        
        // Generate random NFT metadata
        let token_id = collection_data.total_minted + 1;
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
        // For this to work, we need the user to mint in their own collection
        // So the user must be the same as collection_creator
        assert!(user_addr == collection_creator, ENOT_AUTHORIZED);
        
        let token_constructor_ref = token::create_named_token(
            user, // Same user who created the collection
            string::utf8(COLLECTION_NAME),
            nft_description,
            nft_name,
            option::none(),
            token_uri
        );
        
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

    // Create JSON metadata URI
    fun create_token_uri(name: String, description: String, metadata: NFTMetadata): String {
        let token_uri = string::utf8(b"data:application/json,{\"name\":\"");
        string::append(&mut token_uri, name);
        string::append(&mut token_uri, string::utf8(b"\",\"description\":\""));
        string::append(&mut token_uri, description);
        string::append(&mut token_uri, string::utf8(b"\",\"attributes\":["));
        string::append(&mut token_uri, string::utf8(b"{\"trait_type\":\"Background Color\",\"value\":\""));
        string::append(&mut token_uri, metadata.background_color);
        string::append(&mut token_uri, string::utf8(b"\"},{\"trait_type\":\"Shape\",\"value\":\""));
        string::append(&mut token_uri, metadata.shape);
        string::append(&mut token_uri, string::utf8(b"\"},{\"trait_type\":\"Words\",\"value\":\""));
        string::append(&mut token_uri, metadata.word_combination);
        string::append(&mut token_uri, string::utf8(b"\"}]}"));
        token_uri
    }

    // View functions - now require the collection creator address
    #[view]
    public fun get_total_minted(collection_creator: address): u64 acquires NFTCollection {
        if (!exists<NFTCollection>(collection_creator)) {
            return 0
        };
        let collection_data = borrow_global<NFTCollection>(collection_creator);
        collection_data.total_minted
    }

    #[view]
    public fun get_max_supply(): u64 {
        MAX_SUPPLY
    }

    #[view]
    public fun get_collection_address(collection_creator: address): address acquires NFTCollection {
        let collection_data = borrow_global<NFTCollection>(collection_creator);
        object::object_address(&collection_data.collection)
    }

    // Test helper function to preview what would be generated
    #[view]
    public fun preview_random_nft(seed: u64): NFTMetadata {
        generate_random_metadata(seed, 0)
    }


    #[test(aptos_framework = @0x1, creator = @retro_nft, user = @0x123)]
    fun test_initialize_collection(
        aptos_framework: &signer,
        creator: &signer,
        user: &signer,
    ) acquires NFTCollection {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(creator));
        account::create_account_for_test(signer::address_of(user));
        
        // Initialize collection
        initialize_collection(creator);
        
        // Check initial state
        assert!(get_total_minted(signer::address_of(creator)) == 0, 1);
        assert!(get_max_supply() == 10000, 2);
    }


    #[test(aptos_framework = @0x1, creator = @retro_nft, user = @0x123)]
    fun test_mint_nft(
        aptos_framework: &signer,
        creator: &signer,
        user: &signer,
    ) acquires NFTCollection, UserNFTs {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);
        timestamp::update_global_time_for_test_secs(1000);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(creator));
        account::create_account_for_test(signer::address_of(user));
        
        // Initialize collection
        initialize_collection(creator);
        
        // Mint NFT - creator mints in their own collection
        mint_random_nft(creator, signer::address_of(creator));
        
        // Check that minted count increased
        assert!(get_total_minted(signer::address_of(creator)) == 1, 3);
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