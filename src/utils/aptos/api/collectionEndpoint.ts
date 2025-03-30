
import { BlockchainNFT } from "../types";
import { APTOS_API, CREATOR_ADDRESS, NFT_COLLECTION_NAME, NFT_COLLECTION_ID } from "../constants";

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
    
    // Approach 1: Try the Token V2 specific endpoint for current token ownerships
    // This is specifically designed for the Proud Lion collection format seen in the explorer
    const v2Endpoint = `${APTOS_API}/accounts/${walletAddress}/current_token_ownerships_v2?limit=100`;
    console.log(`Trying Token V2 endpoint: ${v2Endpoint}`);
    
    try {
      const v2Response = await fetch(v2Endpoint);
      
      if (v2Response.ok) {
        const v2Data = await v2Response.json();
        console.log(`V2 endpoint returned ${v2Data.length} tokens`);
        
        // Filter for our collection and map to NFT format
        const v2Tokens = v2Data
          .filter((token: any) => {
            // Check multiple criteria to identify our collection
            return (token.current_token_data?.collection_name === collectionName) || 
                   (token.current_token_data?.creator_address === CREATOR_ADDRESS) ||
                   (token.current_collection_data?.collection_id === NFT_COLLECTION_ID) ||
                   (token.token_data_id_hash && token.token_data_id_hash.includes(CREATOR_ADDRESS.toLowerCase()));
          })
          .map((token: any) => {
            // Format token ID to match the explorer format (with collection ID and version)
            const tokenId = token.token_data_id_hash ? 
              `${token.token_data_id_hash}${token.property_version ? `/${token.property_version}` : '/0'}` : 
              token.token_data_id || token.token_id;
              
            return {
              tokenId: tokenId,
              name: token.current_token_data?.name || `${NFT_COLLECTION_NAME} #${(tokenId || "").substring(0, 6)}`,
              imageUrl: token.current_token_data?.uri || "",
              creator: token.current_token_data?.creator_address || CREATOR_ADDRESS,
              standard: "v2",
              properties: token.property_version ? JSON.stringify({property_version: token.property_version}) : "{}",
              collectionName: token.current_token_data?.collection_name,
              collectionId: token.current_collection_data?.collection_id
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
        
        // Filter for our collection
        const tokens = tokenData
          .filter((token: any) => 
            token.collection_name === collectionName || 
            token.creator_address === CREATOR_ADDRESS ||
            (token.collection_id && token.collection_id === NFT_COLLECTION_ID)
          )
          .map((token: any) => {
            // Format token ID to match the explorer format
            const tokenId = token.token_data_id_hash ? 
              `${token.token_data_id_hash}/0` : token.token_data_id;
              
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
    
    // Approach 3: Try the token_ownerships endpoint
    const ownershipsEndpoint = `${APTOS_API}/accounts/${walletAddress}/token_ownerships`;
    console.log(`Trying token_ownerships endpoint: ${ownershipsEndpoint}`);
    
    try {
      const ownershipsResponse = await fetch(ownershipsEndpoint);
      
      if (ownershipsResponse.ok) {
        const ownerships = await ownershipsResponse.json();
        console.log(`Found ${ownerships.length} token ownerships`);
        
        // Filter for our collection and map to NFT format
        const collectionTokens = ownerships
          .filter((token: any) => 
            token.collection_name === collectionName || 
            token.collection_id === NFT_COLLECTION_ID ||
            token.creator_address === CREATOR_ADDRESS
          )
          .map((token: any) => {
            // Format token ID properly with version
            const tokenId = token.token_data_id_hash ? 
              `${token.token_data_id_hash}/${token.property_version || '0'}` : 
              token.token_id || token.id;
              
            return {
              tokenId: tokenId,
              name: token.name || `${NFT_COLLECTION_NAME} #${(token.token_data_id_hash || "").substring(0, 6)}`,
              imageUrl: token.uri || token.metadata_uri || "",
              creator: token.creator_address || CREATOR_ADDRESS,
              standard: token.token_standard || "v2",
              properties: token.properties ? JSON.stringify(token.properties) : "{}"
            };
          });
          
        if (collectionTokens.length > 0) {
          console.log(`Found ${collectionTokens.length} tokens from collection in ownerships`);
          return collectionTokens;
        }
      } else {
        console.log(`Token ownerships endpoint returned ${ownershipsResponse.status}`);
      }
    } catch (err) {
      console.error("Error with token_ownerships endpoint:", err);
    }
    
    console.log("No NFTs found after trying all collection endpoints");
    return [];
  } catch (collectionError) {
    console.error("Error with all collection endpoint approaches:", collectionError);
    return [];
  }
}
