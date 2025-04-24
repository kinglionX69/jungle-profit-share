
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

export type { TokenV2Data, TokenData };
