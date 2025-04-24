
import { BlockchainNFT } from "../../types";
import { APTOS_API, NFT_COLLECTION_NAME, NFT_COLLECTION_ID, CREATOR_ADDRESS } from "../../constants";
import { TokenV2Data } from "../types/collectionTypes";

export const fetchV2Tokens = async (walletAddress: string): Promise<BlockchainNFT[]> => {
  try {
    const v2Endpoint = `${APTOS_API}/accounts/${walletAddress}/current_token_ownerships_v2?limit=100`;
    console.log(`Trying Token V2 endpoint: ${v2Endpoint}`);
    
    const v2Response = await fetch(v2Endpoint);
    
    if (!v2Response.ok) return [];
    
    const v2Data = await v2Response.json();
    console.log(`V2 endpoint returned ${v2Data.length} tokens`);
    
    if (v2Data.length > 0) {
      console.log(`Sample token from v2 endpoint:`, v2Data[0]);
    }
    
    const v2Tokens = v2Data
      .filter((token: TokenV2Data) => {
        const hasCollectionName = 
          (token.current_token_data?.collection_name && 
           (token.current_token_data.collection_name.includes("Lion") || 
            token.current_token_data.collection_name.includes("lion") || 
            token.current_token_data.collection_name.includes("Proud")));
        
        const hasCollectionId = 
          (token.current_token_data?.collection_id === NFT_COLLECTION_ID) ||
          (token.current_collection_data?.collection_id === NFT_COLLECTION_ID);
        
        const hasCreator = token.current_token_data?.creator_address === CREATOR_ADDRESS;
        
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
        const collectionName = token.current_token_data?.collection_name || NFT_COLLECTION_NAME;
        const tokenId = token.token_data_id_hash ? 
          `${token.token_data_id_hash}${token.property_version ? `/${token.property_version}` : '/0'}` : 
          token.token_data_id || token.token_id || '';
          
        let imageUrl = token.current_token_data?.uri || "";
        
        if (!imageUrl && token.token_properties_mutated_v1) {
          const props = token.token_properties_mutated_v1 as Record<string, unknown>;
          imageUrl = String(props.uri || props.image_uri || props.image || "");
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
      
    return v2Tokens;
  } catch (err) {
    console.error("Error with Token V2 endpoint:", err);
    return [];
  }
};
