
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
    
    // Approach 1: Try the standard collection endpoint
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
    
    // Approach 2: Try the new token_ownerships endpoint
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
          .map((token: any) => ({
            tokenId: token.token_data_id_hash || token.token_id || token.id,
            name: token.name || `${NFT_COLLECTION_NAME} #${(token.token_data_id_hash || "").substring(0, 6)}`,
            imageUrl: token.uri || token.metadata_uri || "",
            creator: token.creator_address || CREATOR_ADDRESS,
            standard: token.token_standard || "v2",
            properties: token.properties ? JSON.stringify(token.properties) : "{}"
          }));
          
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
    
    // Approach 3: Look at the creator's collections and check for tokens in the wallet
    try {
      console.log("Trying creator's collections approach");
      const creatorEndpoint = `${APTOS_API}/accounts/${CREATOR_ADDRESS}/resource/0x3::token::Collections`;
      const creatorResponse = await fetch(creatorEndpoint);
      
      if (creatorResponse.ok) {
        const creatorData = await creatorResponse.json();
        console.log("Found creator's collections data");
        
        // This approach would require additional logic to check for each token
        // if it's owned by this wallet, which is complex and might be inefficient
        // Log relevant info for debugging instead
        console.log(`Creator collections available: ${Object.keys(creatorData.data?.collections_table?.handle || {}).length}`);
      }
    } catch (err) {
      console.error("Error with creator's collections approach:", err);
    }
    
    // If all approaches failed, return empty array
    console.log("No NFTs found after trying all collection endpoints");
    return [];
  } catch (collectionError) {
    console.error("Error with all collection endpoint approaches:", collectionError);
    return [];
  }
}
