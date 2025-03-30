
import { BlockchainNFT } from "../types";
import { APTOS_API, CREATOR_ADDRESS } from "../constants";

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
    const collectionEndpoint = `${APTOS_API}/accounts/${walletAddress}/collection/${collectionName}`;
    console.log(`Trying direct collection endpoint: ${collectionEndpoint}`);
    
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
          name: `Proud Lion #${tokenId.substring(0, 6)}`,
          imageUrl: "",  // We don't have the image URL from this endpoint
          creator: collectionData.creator || CREATOR_ADDRESS,
          standard: "v2",
          properties: "{}"
        }));
      }
    }
    
    // Another approach - try to find NFTs in creator's account that might be in the wallet
    console.log("Trying to get collection info from creator's account");
    
    // Try with the collection in creator's account
    const creatorCollectionEndpoint = `${APTOS_API}/accounts/${CREATOR_ADDRESS}/resource/0x3::token::Collections`;
    console.log(`Checking creator's collections: ${creatorCollectionEndpoint}`);
    
    const creatorCollectionResponse = await fetch(creatorCollectionEndpoint);
    if (creatorCollectionResponse.ok) {
      const creatorCollections = await creatorCollectionResponse.json();
      console.log("Creator collections:", creatorCollections);
    }
    
    // If everything failed, check if the wallet has ANY tokens of any type
    // as a diagnostic approach
    console.log("Checking if wallet has ANY tokens of any type as diagnostic");
    
    const accountTokensEndpoint = `${APTOS_API}/accounts/${walletAddress}/resources`;
    const accountResponse = await fetch(accountTokensEndpoint);
    if (accountResponse.ok) {
      const resources = await accountResponse.json();
      const tokenRelatedResources = resources.filter((r: any) => 
        r.type.includes('token') || r.type.includes('nft') || r.type.includes('collection')
      );
      
      console.log("Token-related resources found:", tokenRelatedResources.length);
      if (tokenRelatedResources.length > 0) {
        console.log("Types found:", tokenRelatedResources.map((r: any) => r.type));
      }
    }
    
    // If we've tried everything and still found nothing, return empty array
    console.log("No NFTs found after trying all endpoints");
    return [];
  } catch (collectionError) {
    console.error("Error with direct collection endpoint:", collectionError);
    return [];
  }
}
