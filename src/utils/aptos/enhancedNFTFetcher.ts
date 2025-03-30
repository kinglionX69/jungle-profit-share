import { toast } from "sonner";
import { 
  APTOS_API, 
  APTOS_INDEXER_API, 
  NFT_COLLECTION_NAME, 
  CREATOR_ADDRESS, 
  NFT_COLLECTION_ID,
  USE_DEMO_MODE,
  IS_TESTNET
} from "./constants";
import { BlockchainNFT } from "./types";
import { resolveNFTImages } from "./nftImageResolver";

/**
 * Enhanced method to fetch NFTs that tries multiple approaches sequentially
 * @param walletAddress The wallet address to fetch NFTs for
 * @param collectionName The collection name to filter by
 * @returns Array of NFTs from all successful methods combined
 */
export const enhancedNFTFetch = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  console.log(`Beginning enhanced NFT fetch for wallet: ${walletAddress}, collection: ${collectionName}`);
  console.log(`Network: ${IS_TESTNET ? 'TESTNET' : 'MAINNET'}`);
  console.log(`Collection ID: ${NFT_COLLECTION_ID}`);
  console.log(`Creator Address: ${CREATOR_ADDRESS}`);
  
  // Standardize wallet address format
  if (walletAddress && !walletAddress.startsWith('0x')) {
    walletAddress = `0x${walletAddress}`;
  }
  
  let allNFTs: BlockchainNFT[] = [];
  let errors: string[] = [];
  
  // In test mode, directly return demo NFTs
  if (USE_DEMO_MODE) {
    console.log("DEMO MODE ENABLED - Returning demo NFTs");
    return createDemoNFTs();
  }
  
  try {
    // Try all methods in parallel for speed, then combine results
    console.log("Starting parallel NFT fetch methods...");
    
    const results = await Promise.allSettled([
      fetchAllWalletTokens(walletAddress),
      fetchFromIndexerApi(walletAddress, collectionName),
      fetchFromToken2022Standard(walletAddress, collectionName),
      fetchFromOwnershipsEndpoint(walletAddress, collectionName)
    ]);
    
    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        console.log(`Method ${index + 1} found ${result.value.length} NFTs`);
        
        // Add NFTs from this method, avoiding duplicates
        result.value.forEach(nft => {
          if (!allNFTs.some(existingNft => existingNft.tokenId === nft.tokenId)) {
            allNFTs.push(nft);
          }
        });
      } else if (result.status === 'rejected') {
        console.error(`Method ${index + 1} failed:`, result.reason);
        errors.push(`Method ${index + 1}: ${result.reason}`);
      } else if (result.status === 'fulfilled' && result.value.length === 0) {
        console.log(`Method ${index + 1} found no NFTs`);
      }
    });
    
    console.log(`Combined results: ${allNFTs.length} unique NFTs found`);
    
    // If we found any NFTs, process them
    if (allNFTs.length > 0) {
      const processedNFTs = await resolveNFTImages(allNFTs);
      console.log(`Processed ${processedNFTs.length} NFTs with images`);
      return processedNFTs;
    }
    
    // If all methods failed, try demo mode or return empty
    if (errors.length === results.length) {
      console.error("All fetching methods failed:", errors);
      
      if (USE_DEMO_MODE) {
        console.log("Using demo NFTs as fallback");
        return createDemoNFTs();
      }
    }
    
    // If we reach here, no NFTs were found
    console.log("No NFTs found for wallet:", walletAddress);
    return [];
  } catch (error) {
    console.error("Critical error in NFT fetching:", error);
    
    if (USE_DEMO_MODE) {
      console.log("Using demo NFTs after critical error");
      return createDemoNFTs();
    }
    
    return [];
  }
};

/**
 * NEW METHOD: Fetch ALL tokens in the wallet without filtering
 * This is a more aggressive approach to find any tokens
 */
const fetchAllWalletTokens = async (walletAddress: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Trying to fetch ALL tokens for wallet: ${walletAddress}`);
    
    // Use the most general endpoint with high limit
    const endpoint = `${APTOS_API}/accounts/${walletAddress}/tokens?limit=200`;
    console.log(`Fetching from: ${endpoint}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`All tokens endpoint error: ${response.status}`);
    }
    
    const tokens = await response.json();
    console.log(`Received ${tokens.length} total tokens from wallet`);
    
    // We'll map all tokens first, then filter later
    const allTokens = tokens.map((token: any) => {
      // Generate a unique token ID from available fields
      const tokenId = token.id_hash || token.token_data_id_hash || token.token_id || 
                     (token.id ? token.id : `token-${Math.random().toString(36).substring(2, 10)}`);
                     
      return {
        tokenId: tokenId,
        name: token.name || token.token_name || `Token #${tokenId.substring(0, 6)}`,
        imageUrl: token.uri || token.metadata_uri || token.image || "",
        creator: token.creator_address || token.creator || CREATOR_ADDRESS,
        standard: token.token_standard || "unknown",
        properties: token.properties ? JSON.stringify(token.properties) : "{}",
        collectionName: token.collection_name || "Unknown Collection",
        collectionId: token.collection_id || ""
      };
    });
    
    console.log(`Mapped ${allTokens.length} total tokens`);
    return allTokens;
  } catch (error) {
    console.error("Error fetching all wallet tokens:", error);
    return [];
  }
};

/**
 * Fetch NFTs using the Aptos Indexer API with GraphQL
 */
const fetchFromIndexerApi = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Trying Indexer API for wallet: ${walletAddress}, collection: ${collectionName}`);
    
    // Use the optimized GraphQL query format
    const query = {
      query: `
        query CurrentTokens($owner_address: String, $collection_name: String, $collection_id: String, $creator_address: String) {
          current_token_ownerships(
            where: {
              owner_address: {_eq: $owner_address},
              _or: [
                {collection_name: {_eq: $collection_name}},
                {collection_id: {_eq: $collection_id}},
                {creator_address: {_eq: $creator_address}}
              ],
              amount: {_gt: "0"}
            }
            limit: 100
          ) {
            name
            collection_name
            collection_id
            property_version
            token_data_id_hash
            creator_address
            transaction_timestamp
            token_properties
            token_standard
            metadata_uri: token_uri
          }
        }
      `,
      variables: {
        owner_address: walletAddress,
        collection_name: collectionName,
        collection_id: NFT_COLLECTION_ID,
        creator_address: CREATOR_ADDRESS
      },
    };

    const response = await fetch(APTOS_INDEXER_API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Indexer API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }
    
    const tokens = result.data?.current_token_ownerships || [];
    
    // Transform the data into our BlockchainNFT format
    return tokens.map((token: any) => ({
      tokenId: token.token_data_id_hash,
      name: token.name || `${collectionName} #${token.token_data_id_hash.substring(0, 6)}`,
      imageUrl: token.metadata_uri || "",
      creator: token.creator_address,
      standard: token.token_standard,
      properties: token.token_properties,
      collectionName: token.collection_name,
      collectionId: token.collection_id
    }));
  } catch (error) {
    console.error("Error with indexer API:", error);
    return [];
  }
};

/**
 * Fetch NFTs using the Token 2022 standard endpoint
 */
const fetchFromToken2022Standard = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Trying Token 2022 standard for wallet: ${walletAddress}`);
    
    // This endpoint works with newer token standards
    const endpoint = `${APTOS_API}/accounts/${walletAddress}/tokens?limit=100`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Token standard endpoint error: ${response.status}`);
    }
    
    const tokens = await response.json();
    
    if (!Array.isArray(tokens)) {
      throw new Error("Unexpected response format");
    }
    
    // Filter tokens by collection name or creator
    return tokens
      .filter((token: any) => {
        return token.collection_name === collectionName ||
               token.creator === CREATOR_ADDRESS ||
               token.collection_id === NFT_COLLECTION_ID;
      })
      .map((token: any) => ({
        tokenId: token.id_hash || token.token_data_id || token.token_id,
        name: token.name || `${collectionName} #${(token.id_hash || "").substring(0, 6)}`,
        imageUrl: token.uri || token.metadata_uri || "",
        creator: token.creator,
        standard: token.token_standard || "v2",
        properties: token.properties ? JSON.stringify(token.properties) : "{}",
        collectionName: token.collection_name,
        collectionId: token.collection_id
      }));
  } catch (error) {
    console.error("Error with token 2022 standard:", error);
    return [];
  }
};

/**
 * Fetch NFTs using the ownerships endpoint (best for Token V2)
 */
const fetchFromOwnershipsEndpoint = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Trying Token V2 ownerships endpoint for wallet: ${walletAddress}`);
    
    // This endpoint is optimized for Token V2 standard
    const endpoint = `${APTOS_API}/accounts/${walletAddress}/token_ownerships?limit=100`;
    console.log(`Fetching from: ${endpoint}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Ownerships endpoint error: ${response.status}`);
    }
    
    const ownerships = await response.json();
    console.log(`Received ${ownerships.length} token ownerships`);
    
    // Filter for our collection and map to NFT format
    const filteredTokens = ownerships
      .filter((token: any) => {
        const matchesCollection = token.current_token_data?.collection_name === collectionName;
        const matchesCreator = token.current_token_data?.creator_address === CREATOR_ADDRESS;
        const matchesCollectionId = token.current_collection_data?.collection_id === NFT_COLLECTION_ID;
        const matchesTokenId = token.token_data_id_hash && 
                              token.token_data_id_hash.toLowerCase().includes(CREATOR_ADDRESS.toLowerCase());
        
        return matchesCollection || matchesCreator || matchesCollectionId || matchesTokenId;
      })
      .map((token: any) => {
        // Format token ID to match explorer format (with version number)
        const tokenId = token.token_data_id_hash ? 
          `${token.token_data_id_hash}/${token.property_version || '0'}` : 
          token.token_id || token.token_data_id;
          
        return {
          tokenId: tokenId,
          name: token.current_token_data?.name || `${collectionName} #${(token.token_data_id_hash || "").substring(0, 6)}`,
          imageUrl: token.current_token_data?.uri || "",
          creator: token.current_token_data?.creator_address || CREATOR_ADDRESS,
          standard: "v2",
          properties: token.property_version ? JSON.stringify({property_version: token.property_version}) : "{}",
          collectionName: token.current_token_data?.collection_name,
          collectionId: token.current_collection_data?.collection_id
        };
      });
      
    console.log(`Found ${filteredTokens.length} matching tokens from ownerships endpoint`);
    return filteredTokens;
  } catch (error) {
    console.error("Error with token ownerships endpoint:", error);
    return [];
  }
};

/**
 * Fetch NFTs using account resources endpoint
 */
const fetchFromAccountResources = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Trying account resources for wallet: ${walletAddress}`);
    
    const response = await fetch(`${APTOS_API}/accounts/${walletAddress}/resources`);
    
    if (!response.ok) {
      throw new Error(`Resources endpoint error: ${response.status}`);
    }
    
    const resources = await response.json();
    
    // Find token store resources (both v1 and v2 formats)
    const tokenStores = resources.filter((r: any) => {
      return r.type.includes('TokenStore') || 
             r.type.includes('token_store') ||
             r.type.includes('token::');
    });
    
    if (tokenStores.length === 0) {
      throw new Error("No token store resources found");
    }
    
    const allNfts: BlockchainNFT[] = [];
    
    // Process each token store
    for (const store of tokenStores) {
      try {
        // Find tokens in the data structure (different formats)
        let tokenMap = null;
        
        // Try different paths in the token store data
        const possiblePaths = [
          store.data?.tokens?.tokens,
          store.data?.tokens,
          store.data?.token_data,
          store.data?.data?.tokens,
          store.data?.data,
          store.data
        ];
        
        // Find the first valid token map
        for (const path of possiblePaths) {
          if (path && typeof path === 'object' && !Array.isArray(path)) {
            tokenMap = path;
            break;
          }
        }
        
        if (!tokenMap) continue;
        
        // Process tokens in the map
        for (const [tokenId, tokenData] of Object.entries(tokenMap)) {
          const lowerTokenId = tokenId.toLowerCase();
          const lowerCollectionName = collectionName.toLowerCase();
          const lowerCreatorAddress = CREATOR_ADDRESS.toLowerCase();
          
          // Check if token belongs to our collection
          if (lowerTokenId.includes(lowerCollectionName) || 
              lowerTokenId.includes(lowerCreatorAddress)) {
            
            // Create NFT object
            const nft: BlockchainNFT = {
              tokenId: tokenId,
              name: `${collectionName} #${tokenId.substring(0, 6)}`,
              imageUrl: "",
              creator: CREATOR_ADDRESS,
              standard: "v2",
              properties: "{}"
            };
            
            // Try to extract additional data
            if (tokenData && typeof tokenData === 'object') {
              const tokenObj = tokenData as Record<string, any>;
              
              if ('name' in tokenObj && typeof tokenObj.name === 'string') {
                nft.name = tokenObj.name;
              }
              
              const uriProps = ['uri', 'metadata_uri', 'image', 'content_uri'];
              for (const prop of uriProps) {
                if (prop in tokenObj && typeof tokenObj[prop] === 'string') {
                  nft.imageUrl = tokenObj[prop];
                  break;
                }
              }
              
              if ('creator' in tokenObj && typeof tokenObj.creator === 'string') {
                nft.creator = tokenObj.creator;
              }
              
              if ('properties' in tokenObj) {
                try {
                  nft.properties = typeof tokenObj.properties === 'string' 
                    ? tokenObj.properties 
                    : JSON.stringify(tokenObj.properties);
                } catch (e) {
                  nft.properties = "{}";
                }
              }
            }
            
            allNfts.push(nft);
          }
        }
      } catch (error) {
        console.error("Error processing token store:", error);
      }
    }
    
    return allNFTs;
  } catch (error) {
    console.error("Error with account resources:", error);
    return [];
  }
};

/**
 * Fetch NFTs using the token data endpoint
 */
const fetchFromTokenData = async (walletAddress: string, collectionName: string): Promise<BlockchainNFT[]> => {
  try {
    console.log(`Trying token data endpoint for wallet: ${walletAddress}`);
    
    // Try a direct collection endpoint approach
    const endpoint = `${APTOS_API}/accounts/${walletAddress}/collection/${collectionName}`;
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Token data endpoint error: ${response.status}`);
    }
    
    const collectionData = await response.json();
    
    // Check if we have token IDs in the response
    if (collectionData && collectionData.token_ids && collectionData.token_ids.length > 0) {
      // Map token IDs to NFT objects
      return collectionData.token_ids.map((tokenId: string) => ({
        tokenId: tokenId,
        name: `${collectionName} #${tokenId.substring(0, 6)}`,
        imageUrl: "",
        creator: collectionData.creator || CREATOR_ADDRESS,
        standard: "v2",
        properties: "{}"
      }));
    }
    
    // If no tokens found, try token_ownerships endpoint
    const ownershipsEndpoint = `${APTOS_API}/accounts/${walletAddress}/token_ownerships`;
    const ownershipsResponse = await fetch(ownershipsEndpoint);
    
    if (!ownershipsResponse.ok) {
      throw new Error(`Token ownerships endpoint error: ${ownershipsResponse.status}`);
    }
    
    const ownerships = await ownershipsResponse.json();
    
    // Filter for our collection and map to NFT format
    return ownerships
      .filter((token: any) => 
        token.collection_name === collectionName || 
        token.collection_id === NFT_COLLECTION_ID ||
        token.creator_address === CREATOR_ADDRESS
      )
      .map((token: any) => ({
        tokenId: token.token_data_id_hash || token.token_id || token.id,
        name: token.name || `${collectionName} #${(token.token_data_id_hash || "").substring(0, 6)}`,
        imageUrl: token.uri || token.metadata_uri || "",
        creator: token.creator_address || CREATOR_ADDRESS,
        standard: token.token_standard || "v2",
        properties: token.properties ? JSON.stringify(token.properties) : "{}"
      }));
  } catch (error) {
    console.error("Error with token data endpoint:", error);
    return [];
  }
};

/**
 * Create demo NFTs for testing
 */
const createDemoNFTs = (): BlockchainNFT[] => {
  console.log("Creating demo NFTs for testing");
  
  return Array.from({ length: 5 }).map((_, i) => ({
    tokenId: `demo-token-${i}`,
    name: `${NFT_COLLECTION_NAME} #${i + 1}`,
    imageUrl: `https://picsum.photos/seed/lion${i+1}/300/300`,
    creator: CREATOR_ADDRESS,
    standard: "v2",
    properties: JSON.stringify({
      generation: i.toString(),
      rarity: i === 0 ? "legendary" : i === 1 ? "rare" : "common"
    }),
    collectionName: NFT_COLLECTION_NAME,
    collectionId: NFT_COLLECTION_ID
  }));
};
