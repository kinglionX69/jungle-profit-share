import { BlockchainNFT } from "../types";
import { 
  APTOS_API, 
  CREATOR_ADDRESS, 
  NFT_COLLECTION_NAME, 
  NFT_COLLECTION_ID, 
  IS_TESTNET,
  NFT_IMAGE_BASE_URL 
} from "../constants";

// Define interfaces for API responses to improve type safety
interface TokenV2Data {
  current_token_data?: {
    collection_name?: string;
    creator_address?: string;
    name?: string;
    uri?: string;
    collection_id?: string;
    description?: string;
  };
  current_collection_data?: {
    collection_id?: string;
    collection_name?: string;
  };
  token_data_id_hash?: string;
  property_version?: string | number;
  token_data_id?: string;
  token_id?: string;
  [key: string]: any;
}

interface TokenData {
  collection_name?: string;
  creator_address?: string;
  token_data_id_hash?: string;
  token_data_id?: string;
  name?: string;
  uri?: string;
  collection_id?: string;
  [key: string]: any;
}

/**
 * Try to fetch NFTs directly from the collection endpoint
 * @param walletAddress The wallet address
 * @param collectionName The collection name
 * @returns Array of NFTs from the collection
 */
export async function tryDirectCollectionEndpoint(
  walletAddress: string,
  collectionName: string
): Promise<BlockchainNFT[]> {
  try {
    console.log(`Trying direct collection endpoint for wallet: ${walletAddress}, collection: ${collectionName}`);
    console.log(`Looking for collection ID: ${NFT_COLLECTION_ID}`);
    console.log(`Looking for creator: ${CREATOR_ADDRESS}`);
    console.log(`Network: ${IS_TESTNET ? 'TESTNET' : 'MAINNET'}`);
    console.log(`NFT Image base URL: ${NFT_IMAGE_BASE_URL}`);
    
    // Approach 1: Try the Token V2 specific endpoint for current token ownerships
    // This is specifically designed for the Proud Lions Club collection format seen in the explorer
    const v2Endpoint = `${APTOS_API}/accounts/${walletAddress}/current_token_ownerships_v2?limit=100`;
    console.log(`Trying Token V2 endpoint: ${v2Endpoint}`);
    
    try {
      const v2Response = await fetch(v2Endpoint);
      
      if (v2Response.ok) {
        const v2Data = await v2Response.json();
        console.log(`V2 endpoint returned ${v2Data.length} tokens`);
        
        // Log all tokens to see what we're getting
        if (v2Data.length > 0) {
          console.log(`Sample token from v2 endpoint:`, v2Data[0]);
        }
        
        // Filter for our collection and map to NFT format with more relaxed criteria
        const v2Tokens = v2Data
          .filter((token: TokenV2Data) => {
            // Check for collection name in multiple places
            const hasCollectionName = 
              (token.current_token_data?.collection_name && 
               (token.current_token_data.collection_name.includes("Lion") || 
                token.current_token_data.collection_name.includes("lion") || 
                token.current_token_data.collection_name.includes("Proud")));
            
            // Check for collection ID match
            const hasCollectionId = 
              (token.current_token_data?.collection_id === NFT_COLLECTION_ID) ||
              (token.current_collection_data?.collection_id === NFT_COLLECTION_ID);
            
            // Check for creator address match
            const hasCreator = token.current_token_data?.creator_address === CREATOR_ADDRESS;
            
            // Enhanced logging for potential matches
            const possibleMatch = hasCollectionName || hasCollectionId || hasCreator;
            
            if (possibleMatch) {
              console.log("Possible match found in v2 endpoint:", {
                collection_name: token.current_token_data?.collection_name,
                collection_id: token.current_token_data?.collection_id || 
                             token.current_collection_data?.collection_id,
                creator: token.current_token_data?.creator_address,
                name: token.current_token_data?.name || token.current_token_data?.description,
                token_id: token.token_data_id
              });
            }
            
            return possibleMatch;
          })
          .map((token: TokenV2Data) => {
            // Get collection name
            const collectionName = token.current_token_data?.collection_name || NFT_COLLECTION_NAME;
                                 
            // Format token ID to match the explorer format (with collection ID and version)
            const tokenId = token.token_data_id_hash ? 
              `${token.token_data_id_hash}${token.property_version ? `/${token.property_version}` : '/0'}` : 
              token.token_data_id || token.token_id || '';
              
            // Get image URL - try to construct from token ID and base URL
            let imageUrl = token.current_token_data?.uri || "";
            
            // If no image URL yet, try token properties
            if (!imageUrl && token.token_properties_mutated_v1) {
              const props = token.token_properties_mutated_v1 as Record<string, unknown>;
              imageUrl = String(props.uri || props.image_uri || props.image || "");
            }
            
            // If still no image URL, try to extract token ID and use base URL
            if (!imageUrl) {
              // Extract the token ID from the string if possible
              const idMatch = tokenId.match(/0x[a-fA-F0-9]+/);
              if (idMatch) {
                imageUrl = `${NFT_IMAGE_BASE_URL}${idMatch[0]}`;
              }
            }
              
            return {
              tokenId: tokenId,
              name: token.current_token_data?.name || 
                    token.current_token_data?.description || 
                    `${collectionName} #${(tokenId || "").substring(0, 6)}`,
              imageUrl: imageUrl,
              creator: token.current_token_data?.creator_address || CREATOR_ADDRESS,
              standard: "v2",
              properties: token.property_version ? JSON.stringify({property_version: token.property_version}) : "{}",
              collectionName: collectionName,
              collectionId: token.current_token_data?.collection_id || 
                           token.current_collection_data?.collection_id || 
                           NFT_COLLECTION_ID
            };
          });
          
        if (v2Tokens.length > 0) {
          console.log(`Found ${v2Tokens.length} tokens from V2 endpoint`);
          return v2Tokens;
        }
      } else {
        console.log(`V2 endpoint returned ${v2Response.status}`);
      }
    } catch (err) {
      console.error("Error with Token V2 endpoint:", err);
    }
    
    // Approach A: Try the current_token_data endpoint
    const currentTokenEndpoint = `${APTOS_API}/accounts/${walletAddress}/current_token_data?limit=100`;
    console.log(`Trying current token data endpoint: ${currentTokenEndpoint}`);
    
    try {
      const tokenDataResponse = await fetch(currentTokenEndpoint);
      
      if (tokenDataResponse.ok) {
        const tokenData = await tokenDataResponse.json();
        console.log(`Current token data endpoint returned ${tokenData.length} tokens`);
        
        // Log all tokens to see what we're getting
        if (tokenData.length > 0) {
          console.log(`Sample token from current_token_data endpoint:`, tokenData[0]);
        }
        
        // Filter for our collection with more relaxed matching
        const tokens = tokenData
          .filter((token: TokenData) => {
            const possibleMatch = 
              (token.collection_name && token.collection_name.includes("Lion")) ||
              (token.creator_address === CREATOR_ADDRESS) ||
              (token.collection_id === NFT_COLLECTION_ID);
            
            if (possibleMatch) {
              console.log("Possible match found in current_token_data:", {
                collection: token.collection_name,
                creator: token.creator_address,
                token_id: token.token_data_id_hash,
                name: token.name
              });
            }
            
            return (token.collection_name && 
                    (token.collection_name.includes("Lion") || 
                     token.collection_name.includes(collectionName))) || 
                   (token.creator_address === CREATOR_ADDRESS) ||
                   (token.collection_id && token.collection_id === NFT_COLLECTION_ID);
          })
          .map((token: TokenData) => {
            // Format token ID to match the explorer format
            const tokenId = token.token_data_id_hash ? 
              `${token.token_data_id_hash}/0` : token.token_data_id || '';
              
            return {
              tokenId: tokenId,
              name: token.name || `${NFT_COLLECTION_NAME} #${(token.token_data_id_hash || "").substring(0, 6)}`,
              imageUrl: token.uri || "",
              creator: token.creator_address || CREATOR_ADDRESS,
              standard: "v2",
              properties: "{}"
            };
          });
          
        if (tokens.length > 0) {
          console.log(`Found ${tokens.length} tokens from current token data endpoint`);
          return tokens;
        }
      } else {
        console.log(`Current token data endpoint returned ${tokenDataResponse.status}`);
      }
    } catch (err) {
      console.error("Error with current token data endpoint:", err);
    }
    
    // Approach 2: Try the standard collection endpoint
    const collectionEndpoint = `${APTOS_API}/accounts/${walletAddress}/collection/${collectionName}`;
    console.log(`Trying standard collection endpoint: ${collectionEndpoint}`);
    
    try {
      const collectionResponse = await fetch(collectionEndpoint);
      
      if (collectionResponse.ok) {
        const collectionData = await collectionResponse.json();
        console.log("Collection data:", collectionData);
        
        // If we found the collection, look for tokens
        if (collectionData && collectionData.token_ids && collectionData.token_ids.length > 0) {
          console.log(`Found ${collectionData.token_ids.length} tokens in collection`);
          
          // Map the token IDs to NFT objects
          return collectionData.token_ids.map((tokenId: string) => ({
            tokenId: tokenId,
            name: `${NFT_COLLECTION_NAME} #${tokenId.substring(0, 6)}`,
            imageUrl: "",
            creator: collectionData.creator || CREATOR_ADDRESS,
            standard: "v2",
            properties: "{}"
          }));
        }
      } else {
        console.log(`Standard collection endpoint returned ${collectionResponse.status}`);
      }
    } catch (err) {
      console.error("Error with standard collection endpoint:", err);
    }
    
    // IMPORTANT: Skip the token_ownerships endpoint - it's returning 404 errors
    console.log("Skipping token_ownerships endpoint as it's returning 404 errors");
    
    console.log("No NFTs found after trying all collection endpoints");
    return [];
  } catch (collectionError) {
    console.error("Error with all collection endpoint approaches:", collectionError);
    return [];
  }
}
